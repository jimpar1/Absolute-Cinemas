"""Unit tests for Screening model validation and business logic."""

import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta

from cinema.models import Screening, Movie, MovieHall


@pytest.mark.django_db
class TestScreeningValidation:
    """Tests for Screening.clean() validation."""

    def test_screening_rejects_non_half_hour_start_times(self, movie, hall):
        """Start times must be :00 or :30."""
        bad_time = timezone.now().replace(minute=15, second=0, microsecond=0)
        screening = Screening(movie=movie, hall=hall, start_time=bad_time, price=10, available_seats=100)
        
        with pytest.raises(ValidationError) as exc:
            screening.clean()
        
        assert "start_time" in exc.value.error_dict
        assert "half-hour" in str(exc.value).lower() or "hour" in str(exc.value).lower()

    def test_screening_accepts_hour_start_time(self, movie, hall):
        """Start time at :00 should be valid."""
        good_time = timezone.now().replace(minute=0, second=0, microsecond=0)
        screening = Screening(movie=movie, hall=hall, start_time=good_time, price=10, available_seats=100)
        
        # Should not raise
        screening.clean()

    def test_screening_accepts_half_hour_start_time(self, movie, hall):
        """Start time at :30 should be valid."""
        good_time = timezone.now().replace(minute=30, second=0, microsecond=0)
        screening = Screening(movie=movie, hall=hall, start_time=good_time, price=10, available_seats=100)
        
        # Should not raise
        screening.clean()

    def test_screening_detects_overlap_in_same_hall(self, movie, hall):
        """Overlapping screenings in same hall are rejected."""
        # Create first screening 10:00-12:00 (120min movie)
        start1 = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)
        Screening.objects.create(
            movie=movie, hall=hall,
            start_time=start1,
            price=10
        )
        
        # Try to create second screening at 10:30 (overlaps with first)
        start2 = timezone.now().replace(hour=10, minute=30, second=0, microsecond=0)
        screening2 = Screening(
            movie=movie, hall=hall,
            start_time=start2,
            price=10,
            available_seats=100
        )
        
        with pytest.raises(ValidationError) as exc:
            screening2.clean()
        
        assert "overlap" in str(exc.value).lower()

    def test_screening_allows_overlap_in_different_halls(self, movie):
        """Same time in different halls is allowed."""
        hall1 = MovieHall.objects.create(name="Hall 1", capacity=100)
        hall2 = MovieHall.objects.create(name="Hall 2", capacity=150)
        
        start = timezone.now().replace(hour=14, minute=0, second=0, microsecond=0)
        
        # Create screening in hall1
        Screening.objects.create(
            movie=movie, hall=hall1,
            start_time=start,
            price=10
        )
        
        # Create screening in hall2 at same time - should be allowed
        screening2 = Screening(
            movie=movie, hall=hall2,
            start_time=start,
            price=10,
            available_seats=150
        )
        
        # Should not raise
        screening2.clean()
        screening2.save()
        
        assert Screening.objects.filter(start_time=start).count() == 2

    def test_screening_allows_consecutive_screenings(self, movie, hall):
        """Consecutive screenings (no gap) should be allowed."""
        # First screening 10:00-12:00
        start1 = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)
        screening1 = Screening.objects.create(
            movie=movie, hall=hall,
            start_time=start1,
            price=10
        )
        
        # Second screening starts exactly when first ends (12:00)
        start2 = screening1.end_time
        screening2 = Screening(
            movie=movie, hall=hall,
            start_time=start2,
            price=10,
            available_seats=100
        )
        
        # Should not raise (no overlap, just consecutive)
        screening2.clean()
        screening2.save()

    def test_screening_update_excludes_self_from_overlap_check(self, movie, hall):
        """Updating a screening should not detect itself as overlapping."""
        start = timezone.now().replace(hour=15, minute=0, second=0, microsecond=0)
        screening = Screening.objects.create(
            movie=movie, hall=hall,
            start_time=start,
            price=10
        )
        
        # Update the price (no change to time)
        screening.price = 15
        
        # Should not raise (excludes self from overlap check)
        screening.clean()
        screening.save()

    def test_screening_rejects_missing_start_time(self, movie, hall):
        """Validation fails if start_time is None."""
        screening = Screening(movie=movie, hall=hall, start_time=None, price=10, available_seats=100)
        
        with pytest.raises(ValidationError) as exc:
            screening.clean()
        
        assert "start_time" in exc.value.error_dict

    def test_screening_rejects_end_before_start(self, hall):
        """Validation fails if end_time <= start_time (zero duration movie)."""
        # Create a movie with 0 duration (invalid)
        movie_zero = Movie.objects.create(
            title="Zero Duration",
            duration=0,
            genre="Test",
            director="Test",
            release_year=2023
        )

        start = timezone.now().replace(hour=16, minute=0, second=0, microsecond=0)
        screening = Screening(
            movie=movie_zero, hall=hall,
            start_time=start,
            price=10,
            available_seats=100
        )

        with pytest.raises(ValidationError) as exc:
            screening.clean()

        assert "end_time" in exc.value.error_dict or "end time" in str(exc.value).lower()

    def test_negative_price_raises(self, movie, hall):
        """price=-0.01 violates MinValueValidator(0) and raises ValidationError."""
        valid_time = timezone.now().replace(hour=3, minute=0, second=0, microsecond=0)
        screening = Screening(
            movie=movie, hall=hall,
            start_time=valid_time,
            price=Decimal('-0.01'),
            available_seats=100,
        )

        with pytest.raises(ValidationError):
            screening.full_clean()

    def test_zero_price_is_valid(self, movie, hall):
        """price=0.00 is allowed (MinValueValidator(0) is inclusive)."""
        valid_time = timezone.now().replace(hour=3, minute=30, second=0, microsecond=0)
        screening = Screening(
            movie=movie, hall=hall,
            start_time=valid_time,
            price=Decimal('0.00'),
            available_seats=100,
        )

        # Should not raise
        screening.full_clean()


@pytest.mark.django_db
class TestScreeningProperties:
    """Tests for Screening properties and methods."""

    def test_end_time_calculation(self, movie, hall):
        """Test end_time property calculates correctly."""
        start = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0)
        screening = Screening.objects.create(
            movie=movie, hall=hall,
            start_time=start,
            price=10
        )
        
        expected_end = start + timedelta(minutes=movie.duration)
        assert screening.end_time == expected_end

    def test_end_time_returns_none_when_start_time_none(self, movie, hall):
        """Test end_time returns None if start_time is None."""
        screening = Screening(movie=movie, hall=hall, start_time=None, price=10, available_seats=100)
        
        assert screening.end_time is None

    def test_total_seats_from_hall_capacity(self, movie, hall):
        """Test total_seats property returns hall capacity."""
        screening = Screening.objects.create(
            movie=movie, hall=hall,
            start_time=timezone.now().replace(minute=0),
            price=10
        )
        
        assert screening.total_seats == hall.capacity

    def test_save_auto_sets_available_seats_on_creation(self, movie):
        """Test save() auto-sets available_seats from hall capacity."""
        hall = MovieHall.objects.create(name="Large Hall", capacity=250)
        
        screening = Screening(
            movie=movie, hall=hall,
            start_time=timezone.now().replace(minute=0),
            price=12
        )
        
        # Before save, available_seats might not be set
        # After save, should equal hall capacity
        screening.save()
        
        assert screening.available_seats == 250

    def test_save_does_not_reset_available_seats_on_update(self, movie, hall):
        """Test save() does not reset available_seats when updating existing screening."""
        screening = Screening.objects.create(
            movie=movie, hall=hall,
            start_time=timezone.now().replace(minute=0),
            price=10
        )
        
        # Manually change available_seats (simulate booking)
        screening.available_seats = 50
        screening.save()
        
        # Update price
        screening.price = 15
        screening.save()
        
        # available_seats should remain 50, not reset to capacity
        screening.refresh_from_db()
        assert screening.available_seats == 50

    def test_str_representation(self, movie, hall):
        """Test __str__ method returns expected format."""
        start = timezone.now().replace(hour=20, minute=30, second=0, microsecond=0)
        screening = Screening.objects.create(
            movie=movie, hall=hall,
            start_time=start,
            price=10
        )
        
        str_repr = str(screening)
        assert movie.title in str_repr
        assert hall.name in str_repr
        assert "20:30" in str_repr or "2030" in str_repr.replace(":", "")
