"""
Payment views — Stripe integration endpoints for booking payments and subscription checkouts.

Endpoints:
  GET  /api/payments/config/                     → Stripe publishable key
  POST /api/payments/create-booking-intent/      → create PaymentIntent for ticket purchase
  POST /api/payments/create-subscription-checkout/ → create Checkout Session for tier purchase
  POST /api/payments/webhook/                    → Stripe webhook handler
  POST /api/payments/refund/                     → refund a booking
"""

import logging
from urllib.parse import urlparse

import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from dependency_injector.wiring import inject, Provide

from ..container import Container
from ..services import PaymentService, SubscriptionService
from ..models import Booking, Screening, SeatLock

logger = logging.getLogger(__name__)


def _normalize_origin(url: str) -> str | None:
    """Normalize a URL-like string to origin (scheme://host[:port]) if valid."""
    parsed = urlparse((url or '').strip())
    if parsed.scheme not in {'http', 'https'}:
        return None
    if not parsed.netloc or not parsed.hostname:
        return None
    if parsed.username or parsed.password:
        return None
    if parsed.path not in {'', '/'} or parsed.params or parsed.query or parsed.fragment:
        return None
    return f"{parsed.scheme}://{parsed.netloc}".rstrip('/')


def _build_subscription_redirect_urls(frontend_url: str) -> tuple[str, str]:
    """Return validated success/cancel URLs for Stripe checkout redirects."""
    requested_origin = _normalize_origin(frontend_url)
    if not requested_origin:
        raise ValueError('Invalid frontend_url format.')

    allowed_origins = {
        origin for origin in
        (_normalize_origin(o) for o in getattr(settings, 'FRONTEND_ALLOWED_ORIGINS', []))
        if origin
    }

    if requested_origin not in allowed_origins:
        raise ValueError('frontend_url is not allowed.')

    success_url = f"{requested_origin}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{requested_origin}/subscription/cancel"
    return success_url, cancel_url


class StripeConfigView(APIView):
    """Return Stripe publishable key for frontend initialization."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
        })


class CreateBookingIntentView(APIView):
    """Create a Stripe PaymentIntent for a ticket booking."""
    permission_classes = [AllowAny]

    @inject
    def post(self, request,
             payment_service: PaymentService = Provide[Container.payment_service],
             subscription_service: SubscriptionService = Provide[Container.subscription_service]):
        screening_id = request.data.get('screening_id')
        seats_booked = request.data.get('seats_booked')
        seat_numbers = request.data.get('seat_numbers', '')
        session_id = request.data.get('session_id', '')
        customer_name = request.data.get('customer_name', '')
        customer_email = request.data.get('customer_email', '')
        customer_phone = request.data.get('customer_phone', '')

        if not screening_id or not seats_booked:
            return Response({'error': 'screening_id and seats_booked are required.'}, status=400)

        try:
            seats_booked = int(seats_booked)
        except (ValueError, TypeError):
            return Response({'error': 'seats_booked must be an integer.'}, status=400)

        try:
            screening = Screening.objects.get(pk=screening_id)
        except Screening.DoesNotExist:
            return Response({'error': 'Screening not found.'}, status=404)

        if seats_booked > screening.available_seats:
            return Response({'error': f'Not enough seats. Available: {screening.available_seats}'}, status=400)

        # Calculate price using subscription pricing if authenticated
        user = request.user
        if getattr(user, 'is_authenticated', False):
            sub = subscription_service.get_or_create(user)
            pricing = subscription_service.compute_booking_price(sub, seats_booked, screening.price)
            total_price = pricing['total']
        else:
            total_price = float(screening.price) * seats_booked

        metadata = {
            'screening_id': str(screening_id),
            'seats_booked': str(seats_booked),
            'seat_numbers': seat_numbers,
            'session_id': session_id,
            'customer_name': customer_name,
            'customer_email': customer_email,
            'customer_phone': customer_phone,
        }
        if getattr(user, 'is_authenticated', False):
            metadata['user_id'] = str(user.id)

        result = payment_service.create_booking_intent(
            amount_euros=total_price,
            metadata=metadata,
        )
        return Response(result)


class CreateSubscriptionCheckoutView(APIView):
    """Create a Stripe Checkout Session for a subscription tier purchase."""
    permission_classes = [IsAuthenticated]

    @inject
    def post(self, request,
             payment_service: PaymentService = Provide[Container.payment_service]):
        tier = request.data.get('tier')
        billing_period = request.data.get('billing_period', 'monthly')

        if tier not in ('pro', 'ultra'):
            return Response({'error': 'Invalid tier. Choose pro or ultra.'}, status=400)
        if billing_period not in ('monthly', 'annual'):
            return Response({'error': 'Invalid billing_period. Choose monthly or annual.'}, status=400)

        default_frontend_origin = (
            getattr(settings, 'FRONTEND_ALLOWED_ORIGINS', ['http://localhost:5173'])[0]
        )
        frontend_base = request.data.get('frontend_url', default_frontend_origin)
        try:
            success_url, cancel_url = _build_subscription_redirect_urls(frontend_base)
        except ValueError:
            return Response({'error': 'Invalid subscription configuration.'}, status=400)

        result = payment_service.create_subscription_checkout(
            tier=tier,
            billing_period=billing_period,
            user_id=request.user.id,
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return Response(result)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    Handle Stripe webhook events.
    Events handled:
      - payment_intent.succeeded  → create the booking
      - checkout.session.completed → activate subscription
      - payment_intent.payment_failed → release seat locks
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @inject
    def post(self, request,
             subscription_service: SubscriptionService = Provide[Container.subscription_service]):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = PaymentService.verify_webhook(payload, sig_header)
        except Exception as exc:
            logger.warning("Webhook verification failed: %s", exc)
            return Response({'error': 'Webhook verification failed.'}, status=400)

        event_type = event['type']
        data_object = event['data']['object']

        if event_type == 'payment_intent.succeeded':
            self._handle_payment_succeeded(data_object)
        elif event_type == 'checkout.session.completed':
            self._handle_checkout_completed(data_object, subscription_service)
        elif event_type == 'payment_intent.payment_failed':
            self._handle_payment_failed(data_object)
        else:
            logger.info("Unhandled Stripe event: %s", event_type)

        return Response({'status': 'ok'})

    def _handle_payment_succeeded(self, intent):
        """Create the booking from PaymentIntent metadata."""
        metadata = intent.get('metadata', {})
        payment_intent_id = intent['id']

        if Booking.objects.filter(stripe_payment_intent_id=payment_intent_id).exists():
            logger.info("Booking already exists for PaymentIntent %s", payment_intent_id)
            return

        try:
            screening = Screening.objects.get(pk=int(metadata['screening_id']))
        except (Screening.DoesNotExist, KeyError, ValueError):
            logger.error("Screening not found for PaymentIntent %s", payment_intent_id)
            return

        from django.contrib.auth.models import User
        user = None
        user_id = metadata.get('user_id')
        if user_id:
            try:
                user = User.objects.get(pk=int(user_id))
            except User.DoesNotExist:
                logger.warning("User %s not found for payment intent metadata", user_id)

        seats_booked = int(metadata.get('seats_booked', 1))
        total_price = intent['amount'] / 100  # cents → euros

        booking = Booking(
            user=user,
            screening=screening,
            customer_name=metadata.get('customer_name', ''),
            customer_email=metadata.get('customer_email', ''),
            customer_phone=metadata.get('customer_phone', ''),
            seats_booked=seats_booked,
            seat_numbers=metadata.get('seat_numbers', ''),
            total_price=total_price,
            status='confirmed',
            stripe_payment_intent_id=payment_intent_id,
            payment_status='paid',
        )
        booking.save()

        # Clear seat locks for this session
        session_id = metadata.get('session_id')
        if session_id and booking.seat_numbers:
            seats = [s.strip() for s in booking.seat_numbers.split(',') if s.strip()]
            SeatLock.objects.filter(
                screening=screening,
                seat_number__in=seats,
                session_id=session_id,
            ).delete()

        logger.info("Booking #%d created via webhook for PI %s", booking.id, payment_intent_id)

    def _handle_checkout_completed(self, session, subscription_service):
        """Activate subscription tier after successful Checkout Session."""
        metadata = session.get('metadata', {})
        user_id = metadata.get('user_id')
        tier = metadata.get('tier')

        if not user_id or not tier:
            logger.warning("Checkout session missing user_id or tier metadata")
            return

        from django.contrib.auth.models import User
        try:
            user = User.objects.get(pk=int(user_id))
        except User.DoesNotExist:
            logger.error("User %s not found for checkout session", user_id)
            return

        sub = subscription_service.subscribe(user, tier)
        sub.stripe_checkout_session_id = session['id']
        sub.save(update_fields=['stripe_checkout_session_id'])
        logger.info("Subscription updated to '%s' for user %s via checkout", tier, user_id)

    def _handle_payment_failed(self, intent):
        """Release seat locks when a payment fails."""
        metadata = intent.get('metadata', {})
        session_id = metadata.get('session_id')
        screening_id = metadata.get('screening_id')

        if session_id and screening_id:
            try:
                deleted, _ = SeatLock.objects.filter(
                    screening_id=int(screening_id),
                    session_id=session_id,
                ).delete()
                logger.info("Released %d seat locks for failed PI %s", deleted, intent['id'])
            except (ValueError, TypeError):
                logger.debug("Skipping seat lock cleanup for invalid metadata")


class ConfirmSubscriptionView(APIView):
    """
    Confirm a Stripe Checkout Session and activate the subscription.
    Called by the success page so activation doesn't depend on webhooks.
    """
    permission_classes = [IsAuthenticated]

    @inject
    def post(self, request,
             subscription_service: SubscriptionService = Provide[Container.subscription_service]):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id is required.'}, status=400)

        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except stripe.error.StripeError as exc:
            logger.error("Failed to retrieve Checkout Session %s: %s", session_id, exc)
            return Response({'error': 'Could not verify session with Stripe.'}, status=502)

        if session.payment_status != 'paid':
            return Response({'error': 'Session has not been paid.'}, status=400)

        metadata = session.get('metadata', {})
        tier = metadata.get('tier')
        session_user_id = metadata.get('user_id')

        if not tier or str(request.user.id) != str(session_user_id):
            return Response({'error': 'Session does not belong to this user.'}, status=403)

        sub = subscription_service.subscribe(request.user, tier)
        sub.stripe_checkout_session_id = session_id
        sub.save(update_fields=['stripe_checkout_session_id'])

        logger.info("Subscription confirmed to '%s' for user %s via session confirm", tier, request.user.id)
        return Response({
            'tier': sub.tier,
            'expires_at': sub.expires_at,
            'status': 'activated',
        })


class RefundView(APIView):
    """Refund a booking via its Stripe PaymentIntent."""
    # Trigger CodeQL re-scan
    permission_classes = [IsAuthenticated]

    @inject
    def post(self, request,
             payment_service: PaymentService = Provide[Container.payment_service]):
        booking_id = request.data.get('booking_id')
        if not booking_id:
            return Response({'error': 'booking_id is required.'}, status=400)

        try:
            booking = Booking.objects.get(pk=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=404)

        # Only staff or the booking owner can refund
        user = request.user
        if not user.is_staff and booking.user != user:
            return Response({'error': 'Not authorized to refund this booking.'}, status=403)

        if not booking.stripe_payment_intent_id:
            return Response({'error': 'No Stripe payment associated with this booking.'}, status=400)

        if booking.payment_status == 'refunded':
            return Response({'error': 'Booking already refunded.'}, status=400)

        result = payment_service.create_refund(booking.stripe_payment_intent_id)

        booking.payment_status = 'refunded'
        booking.status = 'cancelled'
        booking.save(update_fields=['payment_status', 'status', 'updated_at'])

        # Restore available seats
        booking.screening.available_seats += booking.seats_booked
        booking.screening.save(update_fields=['available_seats'])

        return Response({
            'refund_id': result['refund_id'],
            'refund_status': result['status'],
            'booking_status': booking.status,
            'payment_status': booking.payment_status,
        })
