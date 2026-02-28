"""Integration tests for the Screening API endpoints (CRUD + bookings action)."""

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from datetime import timedelta

from cinema.models import Screening
from cinema.models import Booking
from cinema.tests.conftest import MOVIE_FIELDS, SCREENING_FIELDS, assert_keys_equal


pytestmark = pytest.mark.django_db


def _unwrap_results(data):
    if isinstance(data, dict) and "results" in data:
        return data["results"]
    return data


def test_list_screenings(api_client, screening):
    url = reverse("screening-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = _unwrap_results(response.data)
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


def test_screening_bookings_action_requires_view_booking_perm(api_client, staff_basic, make_staff_user, customer_user, screening):
    # create a booking so the endpoint has something to return
    Booking.objects.create(
        screening=screening,
        user=customer_user,
        customer_name="B",
        customer_email="b@example.com",
        customer_phone="0",
        seats_booked=1,
    )

    url = reverse("screening-bookings", kwargs={"pk": screening.pk})

    api_client.force_authenticate(user=staff_basic)
    denied = api_client.get(url)
    assert denied.status_code == status.HTTP_403_FORBIDDEN

    staff_view = make_staff_user(perm_codenames=["view_booking"])
    api_client.force_authenticate(user=staff_view)
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
