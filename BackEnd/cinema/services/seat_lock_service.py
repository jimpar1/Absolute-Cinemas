"""
SeatLockService — temporary seat locking during the booking flow.
Handles lock acquisition (with expiry takeover), unlock, and querying active locks.
"""

from dataclasses import dataclass
from django.utils import timezone
from datetime import timedelta

from ..repositories import SeatLockRepository
from .errors import ServiceError


@dataclass(frozen=True)
class SeatLockService:
    """Manages temporary seat locks for a screening."""

    repo: SeatLockRepository

    def lock_seat(self, screening, seat_number: str, session_id: str):
        """
        Create or refresh a lock on a seat.
        Takes over expired locks; raises ServiceError if locked by another session
        or already booked.
        """
        # Check if already booked
        active_bookings = screening.bookings.filter(status="confirmed")
        for booking in active_bookings:
            if booking.seat_numbers:
                seats = [
                    s.strip() for s in booking.seat_numbers.split(",") if s.strip()
                ]
                if seat_number in seats:
                    raise ServiceError("Seat already booked")

        lock, created = self.repo.list().get_or_create(
            screening=screening,
            seat_number=seat_number,
            defaults={"session_id": session_id},
        )
        if not created:
            if lock.session_id != session_id:
                if lock.is_expired:
                    lock.session_id = session_id
                    lock.created_at = timezone.now()
                    lock.save()
                else:
                    raise ServiceError("Seat already locked by another user")
            else:
                # Refresh timestamp for our own lock
                lock.created_at = timezone.now()
                lock.save()
        return lock

    def unlock_seat(self, screening, seat_number: str, session_id: str):
        """Remove a specific seat lock owned by the given session."""
        self.repo.list().filter(
            screening=screening, seat_number=seat_number, session_id=session_id
        ).delete()

    def get_locked_seats(self, screening):
        """Return active (non-expired) locks for a screening."""
        return self.repo.list().filter(
            screening=screening, created_at__gte=timezone.now() - timedelta(minutes=10)
        )
