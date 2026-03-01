"""Tests for seat lock service."""

import pytest
from django.utils import timezone
from datetime import timedelta

from cinema.services.seat_lock_service import SeatLockService
from cinema.repositories import SeatLockRepository
from cinema.models import SeatLock


@pytest.mark.django_db
class TestSeatLockService:
    """Test SeatLockService business logic."""

    def test_lock_seat_new_lock(self, screening):
        """Test locking a seat creates a new lock."""
        repo = SeatLockRepository()
        service = SeatLockService(repo=repo)

        lock = service.lock_seat(screening, "A1", "session-1")

        assert lock is not None
        assert lock.seat_number == "A1"
        assert lock.session_id == "session-1"
        assert lock.screening == screening

    def test_lock_seat_refresh_existing_lock(self, screening):
        """Test locking a seat that's already locked by same session refreshes timestamp."""
        repo = SeatLockRepository()
        service = SeatLockService(repo=repo)

        # Create initial lock
        old_lock = SeatLock.objects.create(
            screening=screening,
            seat_number="B1",
            session_id="session-2",
            created_at=timezone.now() - timedelta(minutes=5)
        )
        old_time = old_lock.created_at

        # Lock again with same session
        lock = service.lock_seat(screening, "B1", "session-2")

        assert lock.id == old_lock.id
        assert lock.created_at > old_time

    def test_lock_seat_conflict_recent_lock(self, screening):
        """Test locking a seat locked by another session within 10 minutes."""
        from cinema.services.errors import ServiceError
        repo = SeatLockRepository()
        service = SeatLockService(repo=repo)

        # Create lock from another session (recent)
        SeatLock.objects.create(
            screening=screening,
            seat_number="C1",
            session_id="other-session",
            created_at=timezone.now() - timedelta(minutes=2)
        )

        # Try to lock with different session - should raise error
        with pytest.raises(ServiceError) as exc_info:
            service.lock_seat(screening, "C1", "my-session")

        assert "already locked" in str(exc_info.value.message).lower()

    def test_lock_seat_expired_lock_takeover(self, screening):
        """Test locking a seat with an expired lock (>10 min) allows takeover."""
        repo = SeatLockRepository()
        service = SeatLockService(repo=repo)

        # Create expired lock from another session (>10 minutes old)
        old_lock = SeatLock.objects.create(
            screening=screening,
            seat_number="D1",
            session_id="expired-session",
            created_at=timezone.now() - timedelta(minutes=11)  # Must be >10 minutes
        )

        # Lock with new session - should succeed (takeover)
        lock = service.lock_seat(screening, "D1", "new-session")

        assert lock is not None
        assert lock.id == old_lock.id  # Same object, updated
        assert lock.session_id == "new-session"

    def test_unlock_seat(self, screening):
        """Test unlocking a seat."""
        repo = SeatLockRepository()
        service = SeatLockService(repo=repo)

        # Create a lock
        SeatLock.objects.create(
            screening=screening,
            seat_number="E1",
            session_id="unlock-session"
        )

        assert SeatLock.objects.filter(screening=screening, seat_number="E1").exists()

        # Unlock it
        service.unlock_seat(screening, "E1", "unlock-session")

        assert not SeatLock.objects.filter(screening=screening, seat_number="E1", session_id="unlock-session").exists()

    def test_get_locked_seats(self, screening):
        """Test getting locked seats."""
        repo = SeatLockRepository()
        service = SeatLockService(repo=repo)

        # Create some locks (some expired, some active)
        SeatLock.objects.create(
            screening=screening,
            seat_number="F1",
            session_id="active-1",
            created_at=timezone.now() - timedelta(minutes=2)
        )
        SeatLock.objects.create(
            screening=screening,
            seat_number="F2",
            session_id="active-2",
            created_at=timezone.now() - timedelta(minutes=5)
        )
        SeatLock.objects.create(
            screening=screening,
            seat_number="F3",
            session_id="expired",
            created_at=timezone.now() - timedelta(minutes=11)  # Must be >10 minutes to be expired
        )

        locked = service.get_locked_seats(screening)

        # Convert QuerySet to set of seat numbers
        locked_seats = {lock.seat_number for lock in locked}

        # Should only include active locks (not expired)
        assert "F1" in locked_seats
        assert "F2" in locked_seats
        assert "F3" not in locked_seats  # Expired

    def test_unlock_seat_from_different_session_does_nothing(self, screening):
        """Test unlocking a lock owned by another session is a no-op."""
        repo = SeatLockRepository()
        service = SeatLockService(repo=repo)

        # Create lock with session-1
        SeatLock.objects.create(
            screening=screening,
            seat_number="G1",
            session_id="session-1"
        )

        # Try to unlock with session-2 (should not delete)
        service.unlock_seat(screening, "G1", "session-2")

        # Lock should still exist
        assert SeatLock.objects.filter(screening=screening, seat_number="G1").exists()
        # Verify it's still owned by session-1
        lock = SeatLock.objects.get(screening=screening, seat_number="G1")
        assert lock.session_id == "session-1"

    def test_unlock_nonexistent_seat_does_not_raise_error(self, screening):
        """Test unlocking a non-existent lock doesn't raise error."""
        repo = SeatLockRepository()
        service = SeatLockService(repo=repo)

        # Should not raise any exception
        service.unlock_seat(screening, "H1", "any-session")

        # Verify no lock was created
        assert not SeatLock.objects.filter(screening=screening, seat_number="H1").exists()

    def test_lock_seat_different_screenings_independent(self, movie, hall):
        """Test same seat number can be locked in different screenings."""
        from cinema.models import Screening

        screening1 = Screening.objects.create(
            movie=movie, hall=hall,
            start_time=timezone.now().replace(hour=10, minute=0),
            price=10
        )
        screening2 = Screening.objects.create(
            movie=movie, hall=hall,
            start_time=timezone.now().replace(hour=14, minute=0),
            price=10
        )

        repo = SeatLockRepository()
        service = SeatLockService(repo=repo)

        # Lock A1 in both screenings with same session
        lock1 = service.lock_seat(screening1, "A1", "session-1")
        lock2 = service.lock_seat(screening2, "A1", "session-1")

        assert lock1.id != lock2.id
        assert lock1.screening == screening1
        assert lock2.screening == screening2
        assert SeatLock.objects.filter(seat_number="A1").count() == 2

