"""Integration tests for the Booking API endpoints (CRUD)."""

import pytest
from django.urls import reverse
from rest_framework import status
from django.utils import timezone

from cinema.models import Booking
from cinema.models import SeatLock
from cinema.tests.conftest import (
    BOOKING_RESPONSE_FIELDS,
    MOVIE_FIELDS,
    SCREENING_FIELDS,
    assert_keys_equal,
)


pytestmark = pytest.mark.django_db


def _unwrap_results(data):
    if isinstance(data, dict) and "results" in data:
        return data["results"]
    return data


def test_list_bookings(api_client, user, booking):
    api_client.force_authenticate(user=user)
    url = reverse("booking-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = _unwrap_results(response.data)
    assert isinstance(data, list)
    assert_keys_equal(data[0], BOOKING_RESPONSE_FIELDS)
    assert_keys_equal(data[0]["screening_details"], SCREENING_FIELDS)
    assert_keys_equal(data[0]["screening_details"]["movie_details"], MOVIE_FIELDS)
    assert len(data) >= 1


def test_retrieve_booking(api_client, user, booking):
    api_client.force_authenticate(user=user)
    url = reverse("booking-detail", kwargs={"pk": booking.pk})
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, BOOKING_RESPONSE_FIELDS)
    assert_keys_equal(response.data["screening_details"], SCREENING_FIELDS)
    assert_keys_equal(response.data["screening_details"]["movie_details"], MOVIE_FIELDS)
    assert response.data["customer_name"] == booking.customer_name


def test_create_booking(api_client, user, screening):
    api_client.force_authenticate(user=user)
    url = reverse("booking-list")

    payload = {
        "screening": screening.pk,
        "customer_name": "Jane Doe",
        "customer_email": "jane@example.com",
        "customer_phone": "123456789",
        "seats_booked": 2,
        "seat_numbers": "A1, A2",
    }
    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert_keys_equal(response.data, BOOKING_RESPONSE_FIELDS)
    assert response.data["seat_numbers"].replace(" ", "") == "A1,A2"


def test_update_booking(api_client, user, booking):
    api_client.force_authenticate(user=user)
    url = reverse("booking-detail", kwargs={"pk": booking.pk})

    payload = {
        "screening": booking.screening_id,
        "customer_name": "Updated Name",
        "customer_email": booking.customer_email,
        "customer_phone": booking.customer_phone,
        "seats_booked": booking.seats_booked,
    }
    response = api_client.put(url, payload, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, BOOKING_RESPONSE_FIELDS)
    booking.refresh_from_db()
    assert booking.customer_name == "Updated Name"


def test_partial_update_booking(api_client, user, booking):
    api_client.force_authenticate(user=user)
    url = reverse("booking-detail", kwargs={"pk": booking.pk})
    response = api_client.patch(url, {"customer_phone": "987654321"}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, BOOKING_RESPONSE_FIELDS)
    booking.refresh_from_db()
    assert booking.customer_phone == "987654321"


def test_delete_booking(api_client, user, booking):
    api_client.force_authenticate(user=user)
    url = reverse("booking-detail", kwargs={"pk": booking.pk})
    response = api_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Booking.objects.count() == 0


def test_booking_create_requires_auth(api_client, screening):
    url = reverse("booking-list")
    response = api_client.post(
        url,
        {
            "screening": screening.pk,
            "customer_name": "Anon",
            "customer_email": "anon@example.com",
            "customer_phone": "0",
            "seats_booked": 1,
        },
        format="json",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_booking_seats_booked_cannot_exceed_available(api_client, user, screening):
    screening.available_seats = 1
    screening.save(update_fields=["available_seats"])

    api_client.force_authenticate(user=user)
    url = reverse("booking-list")
    response = api_client.post(
        url,
        {
            "screening": screening.pk,
            "customer_name": "Too Many",
            "customer_email": "tm@example.com",
            "customer_phone": "0",
            "seats_booked": 2,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "seats_booked" in response.data


def test_booking_rejects_seat_numbers_already_booked(api_client, user, screening):
    # First booking reserves A1
    Booking.objects.create(
        screening=screening,
        user=user,
        customer_name="First",
        customer_email="first@example.com",
        customer_phone="0",
        seats_booked=1,
        seat_numbers="A1",
    )

    api_client.force_authenticate(user=user)
    url = reverse("booking-list")
    response = api_client.post(
        url,
        {
            "screening": screening.pk,
            "customer_name": "Second",
            "customer_email": "second@example.com",
            "customer_phone": "0",
            "seats_booked": 1,
            "seat_numbers": "A1",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "seat_numbers" in response.data


def test_booking_rejects_seat_numbers_locked_by_other_session(api_client, user, screening):
    # Create an active lock for C1 owned by session other
    SeatLock.objects.create(screening=screening, seat_number="C1", session_id="other")

    api_client.force_authenticate(user=user)
    url = reverse("booking-list")
    response = api_client.post(
        url,
        {
            "screening": screening.pk,
            "customer_name": "Locked",
            "customer_email": "locked@example.com",
            "customer_phone": "0",
            "seats_booked": 1,
            "seat_numbers": "C1",
            "session_id": "mine",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "seat_numbers" in response.data


def test_booking_allows_status_transitions_and_rejects_invalid(api_client, user, booking):
    api_client.force_authenticate(user=user)
    url = reverse("booking-detail", kwargs={"pk": booking.pk})

    ok = api_client.patch(url, {"status": "confirmed"}, format="json")
    assert ok.status_code == status.HTTP_200_OK
    assert ok.data["status"] == "confirmed"

    ok2 = api_client.patch(url, {"status": "cancelled"}, format="json")
    assert ok2.status_code == status.HTTP_200_OK
    assert ok2.data["status"] == "cancelled"

    bad = api_client.patch(url, {"status": "not-a-status"}, format="json")
    assert bad.status_code == status.HTTP_400_BAD_REQUEST
    assert "status" in bad.data


def test_booking_list_visibility_user_vs_staff(api_client, user, staff_basic, screening):
    # Two bookings: one by regular user, one by staff
    Booking.objects.create(
        screening=screening,
        user=user,
        customer_name="U",
        customer_email="u@example.com",
        customer_phone="0",
        seats_booked=1,
    )
    Booking.objects.create(
        screening=screening,
        user=staff_basic,
        customer_name="S",
        customer_email="s@example.com",
        customer_phone="0",
        seats_booked=1,
    )

    url = reverse("booking-list")

    api_client.force_authenticate(user=user)
    resp_user = api_client.get(url)
    assert resp_user.status_code == status.HTTP_200_OK
    data_user = _unwrap_results(resp_user.data)
    assert all(item["user"] == user.id for item in data_user)

    api_client.force_authenticate(user=staff_basic)
    resp_staff = api_client.get(url)
    assert resp_staff.status_code == status.HTTP_200_OK
    data_staff = _unwrap_results(resp_staff.data)
    assert len(data_staff) >= 2


def test_booking_clears_seat_locks_for_same_session(api_client, user, screening):
    """Integration flow: lock seats -> book with same session_id -> locks cleared."""
    api_client.force_authenticate(user=user)

    session_id = "sess-booking"
    seat_numbers = ["B1", "B2"]

    lock_url = reverse("screening-lock-seats", kwargs={"pk": screening.pk})
    locked_url = reverse("screening-locked-seats", kwargs={"pk": screening.pk})
    booking_url = reverse("booking-list")

    locked = api_client.post(lock_url, {"session_id": session_id, "seat_numbers": seat_numbers}, format="json")
    assert locked.status_code == 200

    before = api_client.get(locked_url)
    assert before.status_code == 200
    assert before.data.get("B1") == session_id
    assert before.data.get("B2") == session_id

    created = api_client.post(
        booking_url,
        {
            "screening": screening.pk,
            "customer_name": "Lock Booker",
            "customer_email": "lock@example.com",
            "customer_phone": "000",
            "seats_booked": 2,
            "seat_numbers": ",".join(seat_numbers),
            "session_id": session_id,
        },
        format="json",
    )
    assert created.status_code == status.HTTP_201_CREATED
    assert_keys_equal(created.data, BOOKING_RESPONSE_FIELDS)

    after = api_client.get(locked_url)
    assert after.status_code == 200
    assert "B1" not in after.data
    assert "B2" not in after.data
