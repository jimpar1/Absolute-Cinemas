"""
PaymentService — wraps Stripe SDK calls for booking payments and subscription checkouts.
All amounts are in cents (Stripe convention).  Currency defaults to EUR.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from decimal import Decimal

import stripe
from django.conf import settings

from .errors import ServiceError

logger = logging.getLogger(__name__)

SUBSCRIPTION_PRICES = {
    'pro':   {'monthly': 900, 'annual': 7900},    # cents
    'ultra': {'monthly': 2900, 'annual': 24900},
}


@dataclass(frozen=True)
class PaymentService:
    """Thin wrapper around the Stripe API (test-mode safe)."""

    def _configure(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY

    # -- Booking (one-time) ------------------------------------------------

    def create_booking_intent(self, *, amount_euros: Decimal, metadata: dict) -> dict:
        """
        Create a Stripe PaymentIntent for a ticket purchase.
        Returns ``{client_secret, payment_intent_id, amount, currency}``.
        """
        self._configure()
        amount_cents = int(Decimal(str(amount_euros)) * 100)
        if amount_cents <= 0:
            return {
                'client_secret': None,
                'payment_intent_id': None,
                'amount': 0,
                'currency': 'eur',
                'free_booking': True,
            }
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='eur',
                metadata=metadata,
                automatic_payment_methods={'enabled': True},
            )
            return {
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'amount': amount_cents,
                'currency': 'eur',
                'free_booking': False,
            }
        except stripe.error.StripeError as exc:
            logger.error("Stripe PaymentIntent creation failed: %s", exc)
            raise ServiceError(str(exc), status_code=502)

    # -- Subscription (Checkout Session) -----------------------------------

    def create_subscription_checkout(self, *, tier: str, billing_period: str,
                                     user_id: int, success_url: str,
                                     cancel_url: str) -> dict:
        """
        Create a Stripe Checkout Session for a subscription tier purchase.
        Returns ``{checkout_url, session_id}``.
        """
        self._configure()
        prices = SUBSCRIPTION_PRICES.get(tier)
        if not prices:
            raise ServiceError(f"No Stripe price for tier '{tier}'", status_code=400)
        amount = prices.get(billing_period)
        if amount is None:
            raise ServiceError(f"Invalid billing period '{billing_period}'", status_code=400)

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                mode='payment',
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': f'CinemaPass {tier.title()} ({billing_period})',
                        },
                        'unit_amount': amount,
                    },
                    'quantity': 1,
                }],
                metadata={
                    'user_id': str(user_id),
                    'tier': tier,
                    'billing_period': billing_period,
                },
                success_url=success_url,
                cancel_url=cancel_url,
            )
            return {
                'checkout_url': session.url,
                'session_id': session.id,
            }
        except stripe.error.StripeError as exc:
            logger.error("Stripe Checkout Session creation failed: %s", exc)
            raise ServiceError(str(exc), status_code=502)

    # -- Refund ------------------------------------------------------------

    def create_refund(self, payment_intent_id: str) -> dict:
        """Issue a full refund for the given PaymentIntent."""
        self._configure()
        try:
            refund = stripe.Refund.create(payment_intent=payment_intent_id)
            return {'refund_id': refund.id, 'status': refund.status}
        except stripe.error.StripeError as exc:
            logger.error("Stripe refund failed: %s", exc)
            raise ServiceError(str(exc), status_code=502)

    # -- Webhook verification ----------------------------------------------

    @staticmethod
    def verify_webhook(payload: bytes, sig_header: str) -> dict:
        """Verify and parse a Stripe webhook event."""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET,
            )
            return event
        except (ValueError, stripe.error.SignatureVerificationError) as exc:
            raise ServiceError(f"Webhook verification failed: {exc}", status_code=400)
