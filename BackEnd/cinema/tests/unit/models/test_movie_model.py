"""Unit tests for Movie model validation and business logic."""

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta

from cinema.models import Movie, Screening, MovieHall


@pytest.mark.django_db
class TestMovieComputedStatus:
    """Tests for Movie.computed_status property."""

    def test_computed_status_now_playing_with_screening_this_week(self, movie, hall):
        """Test computed_status returns 'now_playing' when movie has screening this week."""
        # Create screening for today (this week)
        today = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0)
        
        Screening.objects.create(
            movie=movie,
            hall=hall,
            start_time=today,
            price=10
        )
        
        assert movie.computed_status == 'now_playing'

    def test_computed_status_upcoming_without_screening_this_week(self, movie, hall):
        """Test computed_status returns 'upcoming' when no screenings this week."""
        # Create screening for next month (not this week)
        future = timezone.now() + timedelta(days=30)
        future = future.replace(hour=14, minute=0, second=0, microsecond=0)
        
        Screening.objects.create(
            movie=movie,
            hall=hall,
            start_time=future,
            price=10
        )
        
        assert movie.computed_status == 'upcoming'

    def test_computed_status_upcoming_with_no_screenings(self, movie):
        """Test computed_status returns 'upcoming' when movie has no screenings."""
        assert movie.computed_status == 'upcoming'

    def test_computed_status_now_playing_monday_this_week(self, movie, hall):
        """Test screening on Monday of current week shows as 'now_playing'."""
        now = timezone.now()
        
        # Calculate Monday of this week
        monday = (now - timedelta(days=now.weekday())).replace(
            hour=10, minute=0, second=0, microsecond=0
        )
        
        Screening.objects.create(
            movie=movie,
            hall=hall,
            start_time=monday,
            price=10
        )
        
        assert movie.computed_status == 'now_playing'

    def test_computed_status_now_playing_sunday_this_week(self, movie, hall):
        """Test screening on Sunday of current week shows as 'now_playing'."""
        now = timezone.now()
        
        # Calculate Sunday of this week (6 days after Monday)
        monday = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        sunday = monday + timedelta(days=6, hours=20)
        
        Screening.objects.create(
            movie=movie,
            hall=hall,
            start_time=sunday,
            price=10
        )
        
        assert movie.computed_status == 'now_playing'

    def test_computed_status_upcoming_next_week(self, movie, hall):
        """Test screening next week shows as 'upcoming'."""
        now = timezone.now()
        
        # Calculate Monday of next week
        monday_this_week = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        monday_next_week = monday_this_week + timedelta(days=7, hours=12)
        
        Screening.objects.create(
            movie=movie,
            hall=hall,
            start_time=monday_next_week,
            price=10
        )
        
        assert movie.computed_status == 'upcoming'

    def test_computed_status_upcoming_last_week(self, movie, hall):
        """Test screening last week shows as 'upcoming' (past screenings don't count)."""
        now = timezone.now()
        
        # Calculate last week
        last_week = now - timedelta(days=7)
        last_week = last_week.replace(hour=15, minute=0, second=0, microsecond=0)
        
        Screening.objects.create(
            movie=movie,
            hall=hall,
            start_time=last_week,
            price=10
        )
        
        assert movie.computed_status == 'upcoming'

    def test_computed_status_multiple_screenings_this_week(self, movie, hall):
        """Test movie with multiple screenings this week is 'now_playing'."""
        now = timezone.now()
        base = now.replace(hour=10, minute=0, second=0, microsecond=0)
        
        # Create 3 screenings this week
        for i in range(3):
            screening_time = base + timedelta(days=i)
            Screening.objects.create(
                movie=movie,
                hall=hall,
                start_time=screening_time,
                price=10
            )
        
        assert movie.computed_status == 'now_playing'


@pytest.mark.django_db
class TestMovieValidation:
    """Tests for Movie field validation."""

    def test_duration_must_be_positive(self):
        """Test duration must be at least 1 minute."""
        movie = Movie(
            title="Invalid Movie",
            duration=0,  # Invalid
            genre="Test",
            director="Test Director",
            release_year=2023
        )
        
        with pytest.raises(ValidationError):
            movie.full_clean()

    def test_rating_must_be_between_0_and_10(self):
        """Test rating must be in range [0, 10]."""
        from decimal import Decimal
        
        # Test rating > 10
        movie_high = Movie(
            title="High Rating",
            duration=120,
            genre="Test",
            director="Test Director",
            release_year=2023,
            rating=Decimal("11.0")  # Invalid
        )
        
        with pytest.raises(ValidationError):
            movie_high.full_clean()
        
        # Test negative rating
        movie_negative = Movie(
            title="Negative Rating",
            duration=120,
            genre="Test",
            director="Test Director",
            release_year=2023,
            rating=Decimal("-1.0")  # Invalid
        )
        
        with pytest.raises(ValidationError):
            movie_negative.full_clean()

    def test_rating_can_be_null(self):
        """Test rating can be null/blank."""
        movie = Movie.objects.create(
            title="No Rating",
            duration=120,
            genre="Test",
            director="Test Director",
            release_year=2023,
            rating=None
        )
        
        assert movie.rating is None

    def test_release_year_within_valid_range(self):
        """Test release_year must be between 1900 and 2100."""
        # Test year < 1900
        movie_old = Movie(
            title="Too Old",
            duration=120,
            genre="Test",
            director="Test Director",
            release_year=1899  # Invalid
        )
        
        with pytest.raises(ValidationError):
            movie_old.full_clean()
        
        # Test year > 2100
        movie_future = Movie(
            title="Too Future",
            duration=120,
            genre="Test",
            director="Test Director",
            release_year=2101  # Invalid
        )
        
        with pytest.raises(ValidationError):
            movie_future.full_clean()

    def test_valid_movie_passes_validation(self):
        """Test a valid movie passes full_clean() validation."""
        movie = Movie(
            title="Valid Movie",
            description="A great film",
            duration=120,
            genre="Action",
            director="Great Director",
            release_year=2023,
            rating=8.5,
            status="now_playing"
        )
        
        # Should not raise
        movie.full_clean()


@pytest.mark.django_db
class TestMovieMethods:
    """Tests for Movie methods and properties."""

    def test_str_representation(self):
        """Test __str__ method returns title and year."""
        movie = Movie.objects.create(
            title="The Matrix",
            duration=136,
            genre="Sci-Fi",
            director="Wachowskis",
            release_year=1999
        )
        
        str_repr = str(movie)
        assert "The Matrix" in str_repr
        assert "1999" in str_repr

    def test_movie_defaults_to_upcoming_status(self):
        """Test new movies default to 'upcoming' status."""
        movie = Movie.objects.create(
            title="New Movie",
            duration=120,
            genre="Drama",
            director="New Director",
            release_year=2024
        )
        
        assert movie.status == 'upcoming'

    def test_movie_status_can_be_set_to_now_playing(self):
        """Test movie status can be explicitly set."""
        movie = Movie.objects.create(
            title="Playing Now",
            duration=120,
            genre="Comedy",
            director="Funny Director",
            release_year=2024,
            status='now_playing'
        )
        
        assert movie.status == 'now_playing'

    def test_movie_optional_fields_can_be_blank(self):
        """Test optional fields (description, poster_url, etc.) can be blank."""
        movie = Movie.objects.create(
            title="Minimal Movie",
            duration=90,
            genre="Test",
            director="Test Director",
            release_year=2023,
            description="",
            poster_url=None,
            trailer_url=None,
            shots=None,
            actors=None
        )
        
        assert movie.description == ""
        assert movie.poster_url is None
        assert movie.trailer_url is None
        assert movie.shots is None
        assert movie.actors is None

    def test_movie_json_fields_can_store_data(self):
        """Test JSON fields (shots, actors) can store structured data."""
        movie = Movie.objects.create(
            title="JSON Movie",
            duration=120,
            genre="Test",
            director="Test Director",
            release_year=2023,
            shots=["http://example.com/shot1.jpg", "http://example.com/shot2.jpg"],
            actors=[
                {"name": "Actor 1", "character": "Hero"},
                {"name": "Actor 2", "character": "Villain"}
            ]
        )
        
        assert len(movie.shots) == 2
        assert movie.shots[0] == "http://example.com/shot1.jpg"
        assert len(movie.actors) == 2
        assert movie.actors[0]["name"] == "Actor 1"
