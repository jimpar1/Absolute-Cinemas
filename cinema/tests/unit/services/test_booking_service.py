"""Unit tests for BookingService business logic."""

import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from cinema.services.booking_service import BookingService
from cinema.repositories import BookingRepository


@pytest.mark.django_db
class TestBookingService:
    """Test BookingService methods."""

    @pytest.fixture
    def service(self):
        """BookingService instance with real repository."""
        return BookingService(repo=BookingRepository())

    def test_list_bookings_returns_all(self, service, booking):
        """Test list_bookings returns all bookings."""
        bookings = service.list_bookings()
        assert bookings.count() >= 1
        assert booking in bookings

    def test_list_bookings_returns_multiple(self, service, booking, make_booking):
        """Test list_bookings returns all bookings when multiple exist."""
        booking2 = make_booking()
        booking3 = make_booking()

        bookings = service.list_bookings()

        assert bookings.count() >= 3
        assert booking in bookings
        assert booking2 in bookings
        assert booking3 in bookings

    def test_queryset_for_unauthenticated_returns_empty(self, service, booking):
        """Test queryset_for_user with None returns empty."""
        result = service.queryset_for_user(user=None)
        assert result.count() == 0

    def test_queryset_for_anonymous_user_object(self, service, booking):
        """Django's AnonymousUser (not None) has is_authenticated=False → empty queryset."""
        from django.contrib.auth.models import AnonymousUser

        result = service.queryset_for_user(user=AnonymousUser())
        assert result.count() == 0

    def test_queryset_for_unauthenticated_object_without_is_authenticated(self, service, booking):
        """Test queryset_for_user with object missing is_authenticated returns empty."""
        # Create mock object without is_authenticated attribute
        class FakeUser:
            pass

        result = service.queryset_for_user(user=FakeUser())
        assert result.count() == 0

    def test_queryset_for_regular_user_returns_own_only(self, service, user, booking, make_booking):
        """Test regular users see only their bookings."""
        # Create another user's booking
        other_user = User.objects.create_user(username="other", password="pass")
        other_booking = make_booking(user=other_user)

        result = service.queryset_for_user(user=user)

        assert booking in result
        assert other_booking not in result
        assert result.count() == 1

    def test_queryset_for_regular_user_multiple_own_bookings(self, service, user, booking, make_booking):
        """Test regular user sees all their own bookings."""
        booking2 = make_booking(user=user)
        booking3 = make_booking(user=user)

        # Create another user's booking
        other_user = User.objects.create_user(username="other", password="pass")
        other_booking = make_booking(user=other_user)

        result = service.queryset_for_user(user=user)

        assert booking in result
        assert booking2 in result
        assert booking3 in result
        assert other_booking not in result
        assert result.count() == 3

    def test_queryset_for_staff_returns_all(self, service, staff_user, booking, make_booking):
        """Test staff users see all bookings."""
        other_user = User.objects.create_user(username="u2", password="p")
        other_booking = make_booking(user=other_user)

        result = service.queryset_for_user(user=staff_user)

        assert booking in result
        assert other_booking in result
        assert result.count() >= 2

    def test_queryset_for_staff_sees_multiple_users_bookings(self, service, staff_user, booking, make_booking):
        """Test staff user sees bookings from multiple users."""
        user2 = User.objects.create_user(username="u2", password="p")
        user3 = User.objects.create_user(username="u3", password="p")

        booking2 = make_booking(user=user2)
        booking3 = make_booking(user=user3)

        result = service.queryset_for_user(user=staff_user)

        assert booking in result
        assert booking2 in result
        assert booking3 in result
        assert result.count() >= 3

    def test_my_bookings_returns_ordered_by_date(self, service, user, screening, make_booking):
        """Test my_bookings returns newest first."""
        # Create bookings with different timestamps
        booking1 = make_booking(user=user, screening=screening)
        booking1.booking_date = timezone.now() - timedelta(days=2)
        booking1.save()

        booking2 = make_booking(user=user, screening=screening)
        booking2.booking_date = timezone.now() - timedelta(days=1)
        booking2.save()

        booking3 = make_booking(user=user, screening=screening)
        booking3.booking_date = timezone.now()
        booking3.save()

        result = list(service.my_bookings(user))

        # Should be ordered newest first
        assert result[0] == booking3
        assert result[1] == booking2
        assert result[2] == booking1
        assert len(result) == 3

    def test_my_bookings_excludes_other_users(self, service, user, screening, make_booking):
        """Test my_bookings only returns bookings for the specified user."""
        user_booking = make_booking(user=user, screening=screening)

        other_user = User.objects.create_user(username="other", password="pass")
        other_booking = make_booking(user=other_user, screening=screening)

        result = list(service.my_bookings(user))

        assert user_booking in result
        assert other_booking not in result
        assert len(result) == 1

    def test_my_bookings_empty_for_user_without_bookings(self, service):
        """Test my_bookings returns empty queryset for user with no bookings."""
        user_without_bookings = User.objects.create_user(username="nobookings", password="pass")

        result = list(service.my_bookings(user_without_bookings))

        assert len(result) == 0

    def test_my_bookings_ordering_with_same_timestamp(self, service, user, screening, make_booking):
        """Test my_bookings handles bookings with same timestamp correctly."""
        # Create bookings at exact same time
        now = timezone.now()

        booking1 = make_booking(user=user, screening=screening)
        booking1.booking_date = now
        booking1.save()

        booking2 = make_booking(user=user, screening=screening)
        booking2.booking_date = now
        booking2.save()

        result = list(service.my_bookings(user))

        # Both should be present, order may vary but count should be correct
        assert len(result) == 2
        assert booking1 in result
        assert booking2 in result
