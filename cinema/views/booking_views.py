"""
BookingViewSet — CRUD for ticket bookings.
Only authenticated users can create/view bookings.
Staff can see all bookings; regular users see only their own.
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from dependency_injector.wiring import Provide, inject

from ..container import Container
from ..serializers import BookingSerializer
from ..services import BookingService


class BookingViewSet(viewsets.ModelViewSet):
    """
    CRUD for bookings. Requires authentication.
    Staff see all bookings; regular users only their own.
    """
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['screening', 'status']
    search_fields = ['customer_name', 'customer_email']
    ordering_fields = ['booking_date', 'total_price']
    ordering = ['-booking_date']

    @inject
    def get_queryset(self, service: BookingService = Provide[Container.booking_service]):
        return service.queryset_for_user(self.request.user)
