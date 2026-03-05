"""BookingService — listing and filtering bookings by user role."""

from dataclasses import dataclass
from ..repositories import BookingRepository


@dataclass(frozen=True)
class BookingService:
    """Business logic for ticket bookings."""
    repo: BookingRepository

    def list_bookings(self):
        return self.repo.list()

    def queryset_for_user(self, user):
        """Staff see all bookings; regular users see only their own."""
        if not getattr(user, 'is_authenticated', False):
            return self.repo.list().none()
        if getattr(user, 'is_staff', False):
            return self.repo.list()
        return self.repo.for_user(user)

    def my_bookings(self, user):
        """Return bookings for the given user, newest first."""
        return self.repo.for_user(user).order_by('-booking_date')
