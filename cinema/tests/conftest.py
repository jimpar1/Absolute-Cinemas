import pytest
from django.contrib.auth.models import User
from django.contrib.auth.models import Permission
from rest_framework.test import APIClient

from cinema.models import Booking, Customer, Movie, MovieHall, Screening
from cinema.serializers.domain_serializers import (
    BookingSerializer,
    MovieHallSerializer,
    MovieSerializer,
    ScreeningSerializer,
)


MOVIE_HALL_FIELDS = set(MovieHallSerializer.Meta.fields)
MOVIE_FIELDS = set(MovieSerializer.Meta.fields)
SCREENING_FIELDS = set(ScreeningSerializer.Meta.fields)

# session_id is write-only, so it must not be present in response payloads.
BOOKING_RESPONSE_FIELDS = set(BookingSerializer.Meta.fields) - {"session_id"}


def assert_keys_equal(payload: dict, expected_keys: set[str]) -> None:
    assert isinstance(payload, dict), f"Expected dict, got: {type(payload)}"
    actual_keys = set(payload.keys())
    assert actual_keys == expected_keys, f"Keys mismatch. Missing={expected_keys - actual_keys} Extra={actual_keys - expected_keys}"


def assert_keys_superset(payload: dict, expected_keys: set[str]) -> None:
    assert isinstance(payload, dict), f"Expected dict, got: {type(payload)}"
    actual_keys = set(payload.keys())
    assert expected_keys.issubset(actual_keys), f"Missing keys: {expected_keys - actual_keys}"


@pytest.fixture()
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture()
def user(db) -> User:
    return User.objects.create_user(username="user1", password="pass1234")


@pytest.fixture()
def customer_user(db) -> User:
    user = User.objects.create_user(
        username="customer1",
        password="pass1234",
        email="customer1@example.com",
        first_name="Customer",
        last_name="One",
    )
    Customer.objects.create(user=user, phone="123")
    return user


@pytest.fixture()
def staff_user(db) -> User:
    return User.objects.create_superuser(
        username="staff",
        password="pass1234",
        email="staff@example.com",
    )


@pytest.fixture()
def staff_basic(db) -> User:
    """A staff user with NO explicit model permissions."""
    user = User.objects.create_user(
        username="staff_basic",
        password="pass1234",
        email="staff_basic@example.com",
    )
    user.is_staff = True
    user.save(update_fields=["is_staff"])
    return user


@pytest.fixture()
def make_staff_user(db):
    """Factory to create staff users with specific permission codenames."""

    counter = {"i": 0}

    def _make(*, perm_codenames: list[str], username: str | None = None) -> User:
        counter["i"] += 1
        uname = username or f"staff_perm_{counter['i']}"
        user = User.objects.create_user(
            username=uname,
            password="pass1234",
            email=f"{uname}@example.com",
        )
        user.is_staff = True
        user.save(update_fields=["is_staff"])

        perms = list(Permission.objects.filter(codename__in=perm_codenames))
        user.user_permissions.add(*perms)
        return user

    return _make


@pytest.fixture()
def hall(db) -> MovieHall:
    return MovieHall.objects.create(name="Hall 1", capacity=100)


@pytest.fixture()
def movie_data() -> dict:
    return {
        "title": "Test Movie",
        "description": "Test Description",
        "duration": 120,
        "genre": "Action",
        "director": "Test Director",
        "release_year": 2023,
        "rating": 8.5,
        "status": "now_playing",
        "poster_url": "http://example.com/poster.jpg",
        "trailer_url": "http://example.com/trailer.mp4",
        "shots": ["http://example.com/shot1.jpg"],
        "actors": [{"name": "Actor 1", "character": "Role 1"}],
    }


@pytest.fixture()
def movie(db, movie_data) -> Movie:
    return Movie.objects.create(**movie_data)


@pytest.fixture()
def screening(db, movie, hall) -> Screening:
    # Keep it simple: exact value doesn't matter for most integration checks.
    from django.utils import timezone

    start_time = timezone.now().replace(minute=0, second=0, microsecond=0)
    return Screening.objects.create(movie=movie, hall=hall, start_time=start_time, price=10.00)


@pytest.fixture()
def booking(db, screening, user) -> Booking:
    return Booking.objects.create(
        screening=screening,
        user=user,
        customer_name="John Doe",
        customer_email="john@example.com",
        customer_phone="123456789",
        seats_booked=2,
    )
