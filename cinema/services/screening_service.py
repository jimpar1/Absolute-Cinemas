"""ScreeningService — list screenings and fetch bookings for a screening."""

from dataclasses import dataclass
from ..repositories import ScreeningRepository, BookingRepository


@dataclass(frozen=True)
class ScreeningService:
    """Business logic for screening queries."""
    repo: ScreeningRepository
    booking_repo: BookingRepository

    def list_screenings(self):
        """Return all screenings ordered by start_time."""
        return self.repo.list()

    def bookings_for_screening(self, screening_id: int):
        """Return all bookings for a specific screening."""
        screening = self.repo.get(screening_id)
        return self.booking_repo.for_screening(screening)
