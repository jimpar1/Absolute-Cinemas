"""Unit tests for Booking model validation and business logic."""

import pytest
from django.utils import timezone
from decimal import Decimal

from cinema.models import Booking, Screening


@pytest.mark.django_db
class TestBookingSave:
    """Tests for Booking.save() method business logic."""

    def test_save_auto_calculates_total_price(self, screening, user):
        """Test save() overwrites any manually-passed total_price on creation."""
        screening.price = Decimal("12.50")
        screening.save()

        booking = Booking(
            screening=screening,
            user=user,
            customer_name="John Doe",
            customer_email="john@example.com",
            seats_booked=3,
            total_price=Decimal('999'),  # Must be overwritten by save()
        )

        booking.save()

        expected_price = Decimal("12.50") * 3
        assert booking.total_price == expected_price

    def test_save_decrements_available_seats(self, screening, user):
        """Test save() decrements screening.available_seats."""
        initial_seats = screening.available_seats
        
        booking = Booking(
            screening=screening,
            user=user,
            customer_name="Jane Smith",
            customer_email="jane@example.com",
            seats_booked=5,
            total_price=0
        )
        
        booking.save()
        
        screening.refresh_from_db()
        assert screening.available_seats == initial_seats - 5

    def test_save_raises_error_when_not_enough_seats(self, screening, user):
        """Test save() raises ValueError when seats_booked > available_seats."""
        screening.available_seats = 10
        screening.save()
        
        booking = Booking(
            screening=screening,
            user=user,
            customer_name="Test User",
            customer_email="test@example.com",
            seats_booked=15,  # More than available
            total_price=0
        )
        
        with pytest.raises(ValueError) as exc:
            booking.save()
        
        assert "not enough" in str(exc.value).lower() or "available" in str(exc.value).lower()

    def test_save_allows_exact_remaining_seats(self, screening, user):
        """Test save() succeeds when booking exactly all remaining seats."""
        screening.available_seats = 7
        screening.save()
        
        booking = Booking(
            screening=screening,
            user=user,
            customer_name="Full House",
            customer_email="full@example.com",
            seats_booked=7,  # Exactly all remaining
            total_price=0
        )
        
        booking.save()
        
        screening.refresh_from_db()
        assert screening.available_seats == 0

    def test_update_does_not_recalculate_price_or_decrement_seats(self, screening, user):
        """Test updating existing booking doesn't re-run creation logic."""
        booking = Booking.objects.create(
            screening=screening,
            user=user,
            customer_name="Original Name",
            customer_email="original@example.com",
            seats_booked=2,
            total_price=0  # Will be auto-calculated
        )
        
        original_price = booking.total_price
        screening.refresh_from_db()
        seats_after_first_booking = screening.available_seats
        
        # Update booking (change name)
        booking.customer_name = "Updated Name"
        booking.save()
        
        # Price should not change
        assert booking.total_price == original_price
        
        # Available seats should not be decremented again
        screening.refresh_from_db()
        assert screening.available_seats == seats_after_first_booking

    def test_multiple_bookings_decrement_correctly(self, screening, user):
        """Test multiple bookings correctly decrement available_seats."""
        initial_seats = screening.available_seats
        
        booking1 = Booking.objects.create(
            screening=screening,
            user=user,
            customer_name="User 1",
            customer_email="user1@example.com",
            seats_booked=3,
            total_price=0
        )
        
        screening.refresh_from_db()
        assert screening.available_seats == initial_seats - 3
        
        booking2 = Booking.objects.create(
            screening=screening,
            user=user,
            customer_name="User 2",
            customer_email="user2@example.com",
            seats_booked=2,
            total_price=0
        )
        
        screening.refresh_from_db()
        assert screening.available_seats == initial_seats - 5


@pytest.mark.django_db
class TestBookingValidation:
    """Tests for Booking field validation."""

    def test_seats_booked_positive_validation(self, screening, user):
        """Test seats_booked must be positive (via MinValueValidator)."""
        from django.core.exceptions import ValidationError

        booking = Booking(
            screening=screening,
            user=user,
            customer_name="Test",
            customer_email="test@example.com",
            seats_booked=0,  # Invalid
            total_price=10
        )

        with pytest.raises(ValidationError):
            booking.full_clean()

    def test_negative_seats_booked_raises(self, screening, user):
        """seats_booked=-1 violates MinValueValidator(1) and raises ValidationError."""
        from django.core.exceptions import ValidationError

        booking = Booking(
            screening=screening,
            user=user,
            customer_name="Test",
            customer_email="test@example.com",
            seats_booked=-1,
            total_price=10,
        )

        with pytest.raises(ValidationError):
            booking.full_clean()

    def test_invalid_status_choice_raises(self, screening, user):
        """status='unknown' is not a valid choice and raises ValidationError."""
        from django.core.exceptions import ValidationError

        booking = Booking(
            screening=screening,
            user=user,
            customer_name="Test",
            customer_email="test@example.com",
            seats_booked=1,
            total_price=10,
            status='unknown',
        )

        with pytest.raises(ValidationError):
            booking.full_clean()

    def test_total_price_positive_validation(self, screening, user):
        """Test total_price must be non-negative (via MinValueValidator)."""
        from django.core.exceptions import ValidationError
        
        booking = Booking(
            screening=screening,
            user=user,
            customer_name="Test",
            customer_email="test@example.com",
            seats_booked=2,
            total_price=Decimal("-10.00")  # Invalid
        )
        
        with pytest.raises(ValidationError):
            booking.full_clean()

    def test_customer_email_format_validation(self, screening, user):
        """Test customer_email must be valid email format."""
        from django.core.exceptions import ValidationError
        
        booking = Booking(
            screening=screening,
            user=user,
            customer_name="Test",
            customer_email="not-an-email",  # Invalid
            seats_booked=1,
            total_price=10
        )
        
        with pytest.raises(ValidationError):
            booking.full_clean()


@pytest.mark.django_db
class TestBookingMethods:
    """Tests for Booking methods and properties."""

    def test_str_representation(self, screening, user):
        """Test __str__ method returns expected format."""
        booking = Booking.objects.create(
            screening=screening,
            user=user,
            customer_name="Alice Wonder",
            customer_email="alice@example.com",
            seats_booked=2,
            total_price=0
        )
        
        str_repr = str(booking)
        assert "Alice Wonder" in str_repr
        assert str(booking.id) in str_repr or "#" in str_repr

    def test_booking_defaults_to_pending_status(self, screening, user):
        """Test new bookings default to 'pending' status."""
        booking = Booking.objects.create(
            screening=screening,
            user=user,
            customer_name="Test User",
            customer_email="test@example.com",
            seats_booked=1,
            total_price=0
        )
        
        assert booking.status == 'pending'

    def test_booking_status_can_be_set(self, screening, user):
        """Test booking status can be set to valid choices."""
        booking = Booking.objects.create(
            screening=screening,
            user=user,
            customer_name="Test User",
            customer_email="test@example.com",
            seats_booked=1,
            total_price=0,
            status='confirmed'
        )
        
        assert booking.status == 'confirmed'
        
        booking.status = 'cancelled'
        booking.save()
        
        assert booking.status == 'cancelled'

    def test_booking_can_have_null_user_for_guests(self, screening):
        """Test booking can have null user (for guest bookings)."""
        booking = Booking.objects.create(
            screening=screening,
            user=None,  # Guest booking
            customer_name="Guest User",
            customer_email="guest@example.com",
            seats_booked=1,
            total_price=0
        )
        
        assert booking.user is None
        assert booking.customer_name == "Guest User"

    def test_booking_seat_numbers_optional(self, screening, user):
        """Test seat_numbers field is optional."""
        booking = Booking.objects.create(
            screening=screening,
            user=user,
            customer_name="Test User",
            customer_email="test@example.com",
            seats_booked=2,
            total_price=0,
            seat_numbers=""  # Empty is allowed
        )
        
        assert booking.seat_numbers == ""

    def test_booking_seat_numbers_can_be_set(self, screening, user):
        """Test seat_numbers can store comma-separated values."""
        booking = Booking.objects.create(
            screening=screening,
            user=user,
            customer_name="Test User",
            customer_email="test@example.com",
            seats_booked=3,
            total_price=0,
            seat_numbers="A1,A2,A3"
        )
        
        assert booking.seat_numbers == "A1,A2,A3"
