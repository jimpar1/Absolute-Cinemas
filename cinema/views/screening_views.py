"""
ScreeningViewSet — CRUD for screenings plus seat-lock management.

Custom actions:
  - bookings      GET  /api/screenings/{id}/bookings/
  - lock_seats    POST /api/screenings/{id}/lock_seats/
  - unlock_seats  POST /api/screenings/{id}/unlock_seats/
  - locked_seats  GET  /api/screenings/{id}/locked_seats/
"""

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from dependency_injector.wiring import Provide, inject

from ..container import Container
from ..permissions import IsStaffWithModelPermsOrReadOnly, IsStaffWithBookingViewPermission
from ..serializers import ScreeningSerializer, BookingSerializer
from ..services import ScreeningService, SeatLockService, ServiceError


class ScreeningViewSet(viewsets.ModelViewSet):
    """
    CRUD for screenings with seat-lock endpoints.
    Read access is public; write access requires staff.
    """
    serializer_class = ScreeningSerializer
    permission_classes = [IsStaffWithModelPermsOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['movie', 'hall']
    ordering_fields = ['start_time', 'available_seats']
    ordering = ['start_time']

    @inject
    def get_queryset(self, service: ScreeningService = Provide[Container.screening_service]):
        return service.list_screenings()

    @action(detail=True, methods=['get'], permission_classes=[IsStaffWithBookingViewPermission])
    @inject
    def bookings(self, request, pk=None, service: ScreeningService = Provide[Container.screening_service]):
        """List all bookings for this screening."""
        bookings = service.bookings_for_screening(int(pk))
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    # ── Seat-lock endpoints ──

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    @inject
    def lock_seats(self, request, pk=None, seat_lock_service: SeatLockService = Provide[Container.seat_lock_service]):
        """Lock one or more seats for the current browser session."""
        screening = self.get_object()
        seat_numbers = request.data.get('seat_numbers', [])
        session_id = request.data.get('session_id')

        if not session_id or not seat_numbers:
            return Response({'error': 'session_id and seat_numbers are required'}, status=400)

        locked_seats = []
        try:
            for seat in seat_numbers:
                seat_lock_service.lock_seat(screening, seat, session_id)
                locked_seats.append(seat)
        except ServiceError as e:
            return Response({'error': str(e)}, status=e.status_code)

        return Response({'locked_seats': locked_seats, 'session_id': session_id})

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    @inject
    def unlock_seats(self, request, pk=None, seat_lock_service: SeatLockService = Provide[Container.seat_lock_service]):
        """Unlock specific seats, or all seats for the session if seat_numbers is omitted."""
        screening = self.get_object()
        seat_numbers = request.data.get('seat_numbers', [])
        session_id = request.data.get('session_id')

        if not session_id:
            return Response({'error': 'session_id is required'}, status=400)

        if seat_numbers:
            for seat in seat_numbers:
                seat_lock_service.unlock_seat(screening, seat, session_id)
        else:
            # Unlock ALL seats for this session (used by beforeunload beacon)
            locks = seat_lock_service.repo.list().filter(screening=screening, session_id=session_id)
            locks.delete()

        return Response({'status': 'success'})

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    @inject
    def locked_seats(self, request, pk=None, seat_lock_service: SeatLockService = Provide[Container.seat_lock_service]):
        """Return a dict of {seat_number: session_id} for active locks."""
        screening = self.get_object()
        active_locks = seat_lock_service.get_locked_seats(screening)
        locks_dict = {lock.seat_number: lock.session_id for lock in active_locks}
        return Response(locks_dict)
