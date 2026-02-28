"""
BookingViewSet — CRUD for ticket bookings.
Only authenticated users can create/view bookings.
Staff can see all bookings; regular users see only their own.
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from dependency_injector.wiring import Provide, inject

from ..container import Container
from ..serializers import BookingSerializer
from ..services import BookingService, SubscriptionService


class BookingViewSet(viewsets.ModelViewSet):
    """
    CRUD for bookings.
    Anyone can create a booking (guest support).
    List/retrieve/update/delete require authentication.
    Staff see all bookings; regular users only their own.
    """
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['screening', 'status']
    search_fields = ['customer_name', 'customer_email']
    ordering_fields = ['booking_date', 'total_price']
    ordering = ['-booking_date']

    @inject
    def get_queryset(self, service: BookingService = Provide[Container.booking_service]):
        return service.queryset_for_user(self.request.user)

    @inject
    def perform_create(self, serializer,
                       subscription_service: SubscriptionService = Provide[Container.subscription_service]):
        user = self.request.user
        if getattr(user, 'is_authenticated', False):
            sub = subscription_service.get_or_create(user)
            seats = serializer.validated_data['seats_booked']
            price = serializer.validated_data['screening'].price
            pricing = subscription_service.compute_booking_price(sub, seats, price)
            serializer.save(total_price=pricing['total'])
            subscription_service.consume_free_tickets(sub, pricing['free_seats'])
        else:
            serializer.save()
