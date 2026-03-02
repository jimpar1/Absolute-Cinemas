"""Integration tests for the Screening API endpoints (CRUD + bookings action)."""

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from datetime import timedelta

from cinema.models import Screening
from cinema.models import Booking
from cinema.tests.conftest import MOVIE_FIELDS, SCREENING_FIELDS, assert_keys_equal, unwrap_results


pytestmark = pytest.mark.django_db


def test_list_screenings(api_client, screening):
    url = reverse("screening-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = unwrap_results(response.data)
    assert isinstance(data, list)
    assert_keys_equal(data[0], SCREENING_FIELDS)
    assert_keys_equal(data[0]["movie_details"], MOVIE_FIELDS)
    assert len(data) >= 1


def test_retrieve_screening(api_client, screening):
    url = reverse("screening-detail", kwargs={"pk": screening.pk})
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, SCREENING_FIELDS)
    assert_keys_equal(response.data["movie_details"], MOVIE_FIELDS)
    assert float(response.data["price"]) == 10.00


def test_create_screening(api_client, staff_user, movie, hall):
    api_client.force_authenticate(user=staff_user)
    url = reverse("screening-list")

    payload = {
        "movie": movie.pk,
        "hall": hall.pk,
        "start_time": timezone.now().replace(minute=0, second=0, microsecond=0).isoformat(),
        "price": 10.00,
    }
    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert_keys_equal(response.data, SCREENING_FIELDS)
    assert_keys_equal(response.data["movie_details"], MOVIE_FIELDS)


def test_update_screening(api_client, staff_user, screening, movie, hall):
    api_client.force_authenticate(user=staff_user)
    url = reverse("screening-detail", kwargs={"pk": screening.pk})

    payload = {
        "movie": movie.pk,
        "hall": hall.pk,
        "start_time": screening.start_time.isoformat(),
        "price": 12.00,
    }
    response = api_client.put(url, payload, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, SCREENING_FIELDS)
    screening.refresh_from_db()
    assert float(screening.price) == 12.00


def test_partial_update_screening(api_client, staff_user, screening):
    api_client.force_authenticate(user=staff_user)
    url = reverse("screening-detail", kwargs={"pk": screening.pk})
    response = api_client.patch(url, {"price": 11.00}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, SCREENING_FIELDS)
    screening.refresh_from_db()
    assert float(screening.price) == 11.00


def test_delete_screening(api_client, staff_user, screening):
    api_client.force_authenticate(user=staff_user)
    url = reverse("screening-detail", kwargs={"pk": screening.pk})
    response = api_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Screening.objects.count() == 0


def test_bookings_action(api_client, staff_user, screening):
    api_client.force_authenticate(user=staff_user)
    url = reverse("screening-detail", kwargs={"pk": screening.pk})
    response = api_client.get(f"{url}bookings/")

    assert response.status_code == status.HTTP_200_OK


def test_screening_create_requires_staff_and_model_perms(api_client, user, staff_basic, make_staff_user, movie, hall):
    url = reverse("screening-list")
    payload = {
        "movie": movie.pk,
        "hall": hall.pk,
        "start_time": timezone.now().replace(minute=0, second=0, microsecond=0).isoformat(),
        "price": 10.00,
    }

    unauth = api_client.post(url, payload, format="json")
    assert unauth.status_code == status.HTTP_401_UNAUTHORIZED

    api_client.force_authenticate(user=user)
    nonstaff = api_client.post(url, payload, format="json")
    assert nonstaff.status_code == status.HTTP_403_FORBIDDEN

    api_client.force_authenticate(user=staff_basic)
    staff_no_perms = api_client.post(url, payload, format="json")
    assert staff_no_perms.status_code == status.HTTP_403_FORBIDDEN

    staff_add = make_staff_user(perm_codenames=["add_screening"])
    api_client.force_authenticate(user=staff_add)
    ok = api_client.post(url, payload, format="json")
    assert ok.status_code == status.HTTP_201_CREATED


def test_screening_rejects_invalid_start_time_minutes(api_client, make_staff_user, movie, hall):
    staff_add = make_staff_user(perm_codenames=["add_screening"])
    api_client.force_authenticate(user=staff_add)
    url = reverse("screening-list")
    bad_time = timezone.now().replace(minute=15, second=0, microsecond=0)
    response = api_client.post(
        url,
        {"movie": movie.pk, "hall": hall.pk, "start_time": bad_time.isoformat(), "price": 10.0},
        format="json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "start_time" in response.data


def test_screening_rejects_overlapping_screening_in_same_hall(api_client, make_staff_user, movie, hall):
    staff_add = make_staff_user(perm_codenames=["add_screening"])
    api_client.force_authenticate(user=staff_add)
    url = reverse("screening-list")

    start = timezone.now().replace(minute=0, second=0, microsecond=0)
    first = api_client.post(
        url,
        {"movie": movie.pk, "hall": hall.pk, "start_time": start.isoformat(), "price": 10.0},
        format="json",
    )
    assert first.status_code == status.HTTP_201_CREATED

    # Overlaps because movie duration is 120 minutes in fixtures
    overlap_start = start + timedelta(minutes=30)
    second = api_client.post(
        url,
        {"movie": movie.pk, "hall": hall.pk, "start_time": overlap_start.isoformat(), "price": 10.0},
        format="json",
    )
    assert second.status_code == status.HTTP_400_BAD_REQUEST
    # clean() raises a non-field error string; serializer exposes it under "detail"
    assert "detail" in second.data


def test_screening_update_delete_require_change_delete_perms(api_client, staff_basic, make_staff_user, screening):
    detail = reverse("screening-detail", kwargs={"pk": screening.pk})

    api_client.force_authenticate(user=staff_basic)
    no_change = api_client.patch(detail, {"price": 12.0}, format="json")
    assert no_change.status_code == status.HTTP_403_FORBIDDEN

    staff_change = make_staff_user(perm_codenames=["change_screening"])
    api_client.force_authenticate(user=staff_change)
    ok = api_client.patch(detail, {"price": 12.0}, format="json")
    assert ok.status_code == status.HTTP_200_OK

    api_client.force_authenticate(user=staff_basic)
    no_delete = api_client.delete(detail)
    assert no_delete.status_code == status.HTTP_403_FORBIDDEN

    staff_delete = make_staff_user(perm_codenames=["delete_screening"])
    api_client.force_authenticate(user=staff_delete)
    ok_del = api_client.delete(detail)
    assert ok_del.status_code == status.HTTP_204_NO_CONTENT


def test_screening_bookings_action_is_public(api_client, staff_basic, customer_user, screening):
    """The bookings action returns only seat_numbers and is publicly accessible (AllowAny).
    It exists to show seat availability in the booking UI — no personal data is exposed."""
    Booking.objects.create(
        screening=screening,
        user=customer_user,
        customer_name="B",
        customer_email="b@example.com",
        customer_phone="0",
        seats_booked=1,
    )

    url = reverse("screening-bookings", kwargs={"pk": screening.pk})

    # Unauthenticated access is allowed
    api_client.force_authenticate(user=None)
    anon = api_client.get(url)
    assert anon.status_code == status.HTTP_200_OK
    assert isinstance(anon.data, list)

    # Staff without view_booking perm also allowed (endpoint is public)
    api_client.force_authenticate(user=staff_basic)
    ok = api_client.get(url)
    assert ok.status_code == status.HTTP_200_OK
    assert isinstance(ok.data, list)


def test_lock_unlock_and_list_locked_seats(api_client, screening):
    """Exercise seat-lock endpoints and assert response fields/shapes."""
    lock_url = reverse("screening-lock-seats", kwargs={"pk": screening.pk})
    locked_url = reverse("screening-locked-seats", kwargs={"pk": screening.pk})
    unlock_url = reverse("screening-unlock-seats", kwargs={"pk": screening.pk})

    # Missing payload -> 400 with error field
    bad = api_client.post(lock_url, {}, format="json")
    assert bad.status_code == 400
    assert "error" in bad.data

    session_id = "sess-1"
    seats = ["A1", "A2"]
    locked = api_client.post(lock_url, {"session_id": session_id, "seat_numbers": seats}, format="json")
    assert locked.status_code == 200
    assert set(locked.data.keys()) == {"locked_seats", "session_id"}
    assert locked.data["session_id"] == session_id
    assert locked.data["locked_seats"] == seats

    current = api_client.get(locked_url)
    assert current.status_code == 200
    assert isinstance(current.data, dict)
    assert current.data.get("A1") == session_id
    assert current.data.get("A2") == session_id

    # Unlock only A1
    unlocked = api_client.post(unlock_url, {"session_id": session_id, "seat_numbers": ["A1"]}, format="json")
    assert unlocked.status_code == 200
    assert unlocked.data == {"status": "success"}

    current2 = api_client.get(locked_url)
    assert current2.status_code == 200
    assert "A1" not in current2.data
    assert current2.data.get("A2") == session_id


def test_lock_seats_conflict_and_expiry_takeover(api_client, screening):
    lock_url = reverse("screening-lock-seats", kwargs={"pk": screening.pk})
    locked_url = reverse("screening-locked-seats", kwargs={"pk": screening.pk})

    # Lock A1 with session s1
    s1 = api_client.post(lock_url, {"session_id": "s1", "seat_numbers": ["A1"]}, format="json")
    assert s1.status_code == 200

    # Another session tries to lock same seat -> 400
    s2 = api_client.post(lock_url, {"session_id": "s2", "seat_numbers": ["A1"]}, format="json")
    assert s2.status_code == 400
    assert "error" in s2.data

    # Expire the existing lock, then session s2 should take over
    from cinema.models import SeatLock
    from django.utils import timezone
    from datetime import timedelta

    SeatLock.objects.filter(screening=screening, seat_number="A1").update(
        created_at=timezone.now() - timedelta(minutes=11)
    )

    takeover = api_client.post(lock_url, {"session_id": "s2", "seat_numbers": ["A1"]}, format="json")
    assert takeover.status_code == 200

    current = api_client.get(locked_url)
    assert current.status_code == 200
    assert current.data.get("A1") == "s2"


# ============================================================================
# FILTER AND ORDERING TESTS
# ============================================================================


class TestScreeningFiltering:
    """Tests for screening filtering by movie and hall."""

    def test_filter_screenings_by_movie(self, api_client, make_movie, make_screening, hall):
        """Test filtering screenings by movie ID."""
        movie1 = make_movie(title="Movie 1")
        movie2 = make_movie(title="Movie 2")

        screening1 = make_screening(movie=movie1, hall=hall)
        screening2 = make_screening(movie=movie2, hall=hall)

        url = reverse("screening-list")
        response = api_client.get(url, {"movie": movie1.id})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) >= 1
        # All screenings should be for movie1
        assert all(s["movie"] == movie1.id for s in data)

    def test_filter_screenings_by_hall(self, api_client, make_screening, movie):
        """Test filtering screenings by hall ID."""
        from cinema.models import MovieHall

        hall1 = MovieHall.objects.create(name="Filter Test Hall A", capacity=100)
        hall2 = MovieHall.objects.create(name="Filter Test Hall B", capacity=150)

        screening1 = make_screening(movie=movie, hall=hall1)
        screening2 = make_screening(movie=movie, hall=hall2)

        url = reverse("screening-list")
        response = api_client.get(url, {"hall": hall1.id})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) >= 1
        # All screenings should be in hall1
        assert all(s["hall"] == hall1.id for s in data)

    def test_filter_screenings_by_movie_and_hall(self, api_client, make_movie, make_screening):
        """Test filtering screenings by both movie and hall."""
        from cinema.models import MovieHall

        movie1 = make_movie(title="Movie 1")
        movie2 = make_movie(title="Movie 2")
        hall1 = MovieHall.objects.create(name="Filter Test Hall C", capacity=100)
        hall2 = MovieHall.objects.create(name="Filter Test Hall D", capacity=150)

        # Create various combinations
        s1 = make_screening(movie=movie1, hall=hall1)
        s2 = make_screening(movie=movie1, hall=hall2)
        s3 = make_screening(movie=movie2, hall=hall1)

        url = reverse("screening-list")
        response = api_client.get(url, {"movie": movie1.id, "hall": hall1.id})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) >= 1
        # All screenings should match both filters
        assert all(s["movie"] == movie1.id and s["hall"] == hall1.id for s in data)

    def test_filter_screenings_nonexistent_movie(self, api_client, make_screening, movie, hall):
        """Test filtering by nonexistent movie ID returns empty list."""
        # Create at least one screening so we can test filtering
        make_screening(movie=movie, hall=hall)

        url = reverse("screening-list")
        # Use a very high ID that's unlikely to exist
        response = api_client.get(url, {"movie": 999999})

        # Django filters may return 200 with empty list or 400 for invalid ID
        # Both are acceptable behaviors
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]

        if response.status_code == status.HTTP_200_OK:
            data = unwrap_results(response.data)
            assert len(data) == 0

    def test_filter_screenings_no_filters_returns_all(self, api_client, make_screening, movie, hall):
        """Test no filters returns all screenings."""
        make_screening(movie=movie, hall=hall)
        make_screening(movie=movie, hall=hall)

        url = reverse("screening-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) >= 2


class TestScreeningOrdering:
    """Tests for screening ordering."""

    def test_order_screenings_by_start_time_default(self, api_client, make_screening, movie, hall):
        """Test default ordering is by start_time ascending (earliest first)."""
        from django.utils import timezone

        now = timezone.now().replace(minute=0)

        # Create screenings in random order
        s2 = make_screening(movie=movie, hall=hall, start_time=now + timezone.timedelta(hours=6))
        s1 = make_screening(movie=movie, hall=hall, start_time=now + timezone.timedelta(hours=3))

        url = reverse("screening-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        # Default ordering is start_time ascending
        # First screening should have earliest start_time
        start_times = [s["start_time"] for s in data]
        assert start_times == sorted(start_times)

    def test_order_screenings_by_start_time_descending(self, api_client, make_screening, movie, hall):
        """Test ordering by start_time descending (latest first)."""
        from django.utils import timezone

        now = timezone.now().replace(minute=0)

        s1 = make_screening(movie=movie, hall=hall, start_time=now + timezone.timedelta(hours=3))
        s2 = make_screening(movie=movie, hall=hall, start_time=now + timezone.timedelta(hours=6))

        url = reverse("screening-list")
        response = api_client.get(url, {"ordering": "-start_time"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        start_times = [s["start_time"] for s in data]
        # Should be in reverse chronological order
        assert start_times == sorted(start_times, reverse=True)

    def test_order_screenings_by_available_seats_ascending(self, api_client, make_screening, movie, hall):
        """Test ordering by available_seats (least available first)."""
        from django.utils import timezone
        from cinema.models import Screening

        now = timezone.now().replace(minute=0)

        s1 = make_screening(movie=movie, hall=hall, start_time=now + timezone.timedelta(hours=3))
        s2 = make_screening(movie=movie, hall=hall, start_time=now + timezone.timedelta(hours=6))

        # Manually set different available_seats
        Screening.objects.filter(id=s1.id).update(available_seats=10)
        Screening.objects.filter(id=s2.id).update(available_seats=50)

        url = reverse("screening-list")
        response = api_client.get(url, {"ordering": "available_seats"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        seats = [s["available_seats"] for s in data]
        # Should be ordered least to most available
        assert seats == sorted(seats)

    def test_order_screenings_by_available_seats_descending(self, api_client, make_screening, movie, hall):
        """Test ordering by available_seats descending (most available first)."""
        from django.utils import timezone
        from cinema.models import Screening

        now = timezone.now().replace(minute=0)

        s1 = make_screening(movie=movie, hall=hall, start_time=now + timezone.timedelta(hours=3))
        s2 = make_screening(movie=movie, hall=hall, start_time=now + timezone.timedelta(hours=6))

        Screening.objects.filter(id=s1.id).update(available_seats=10)
        Screening.objects.filter(id=s2.id).update(available_seats=50)

        url = reverse("screening-list")
        response = api_client.get(url, {"ordering": "-available_seats"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        seats = [s["available_seats"] for s in data]
        # Should be ordered most to least available
        assert seats == sorted(seats, reverse=True)


class TestScreeningCombinedFilterAndOrder:
    """Tests combining filters and ordering."""

    def test_filter_by_movie_and_order_by_start_time(self, api_client, make_movie, make_screening, hall):
        """Test filtering by movie and ordering by start_time."""
        from django.utils import timezone

        movie1 = make_movie(title="Movie 1")
        movie2 = make_movie(title="Movie 2")

        now = timezone.now().replace(minute=0)

        # Create screenings for both movies
        s1 = make_screening(movie=movie1, hall=hall, start_time=now + timezone.timedelta(hours=6))
        s2 = make_screening(movie=movie1, hall=hall, start_time=now + timezone.timedelta(hours=3))
        s3 = make_screening(movie=movie2, hall=hall, start_time=now + timezone.timedelta(hours=4))

        url = reverse("screening-list")
        response = api_client.get(url, {
            "movie": movie1.id,
            "ordering": "start_time"
        })

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        # Should only have movie1 screenings
        assert all(s["movie"] == movie1.id for s in data)
        # Should be ordered by start_time
        start_times = [s["start_time"] for s in data]
        assert start_times == sorted(start_times)
