"""Integration tests for auth endpoints (register/login/logout/profile/change-password/refresh/my-bookings)."""

from __future__ import annotations

import uuid

import pytest
from django.urls import reverse
from rest_framework import status

from cinema.models import Booking, Customer
from cinema.tests.conftest import (
    BOOKING_RESPONSE_FIELDS,
    SCREENING_FIELDS,
    MOVIE_FIELDS,
    PAGINATED_KEYS,
    assert_keys_equal,
    assert_keys_superset,
    unwrap_results,
)


pytestmark = pytest.mark.django_db


REGISTER_RESPONSE_KEYS = {"user", "tokens", "message"}
REGISTER_USER_KEYS = {"id", "username", "email", "first_name", "last_name"}
TOKENS_KEYS = {"refresh", "access"}

LOGIN_RESPONSE_KEYS = {"user", "tokens", "message"}
LOGIN_USER_KEYS = {"id", "username", "email", "first_name", "last_name", "customer_profile"}
CUSTOMER_PROFILE_KEYS = {"phone"}

PROFILE_GET_KEYS = {"id", "username", "email", "first_name", "last_name", "phone"}
PROFILE_PUT_KEYS = {"message", "user"}


def test_register_returns_all_fields(api_client):
    url = reverse("auth-register")
    suffix = uuid.uuid4().hex[:8]

    payload = {
        "username": f"u_{suffix}",
        "password": "StrongPass123!",
        "password2": "StrongPass123!",
        "email": f"u_{suffix}@example.com",
        "first_name": "U",
        "last_name": "Test",
        "phone": "555",
    }
    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert_keys_equal(response.data, REGISTER_RESPONSE_KEYS)
    assert_keys_equal(response.data["user"], REGISTER_USER_KEYS)
    assert_keys_equal(response.data["tokens"], TOKENS_KEYS)
    assert isinstance(response.data["message"], str)


def test_login_returns_all_fields_and_customer_profile(api_client):
    # Create a user + customer profile (as registration does)
    username = f"login_{uuid.uuid4().hex[:8]}"
    password = "StrongPass123!"

    register_url = reverse("auth-register")
    api_client.post(
        register_url,
        {
            "username": username,
            "password": password,
            "password2": password,
            "email": f"{username}@example.com",
            "first_name": "Log",
            "last_name": "In",
            "phone": "777",
        },
        format="json",
    )

    login_url = reverse("auth-login")
    response = api_client.post(login_url, {"username": username, "password": password}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, LOGIN_RESPONSE_KEYS)
    assert_keys_equal(response.data["tokens"], TOKENS_KEYS)

    user_payload = response.data["user"]
    assert_keys_equal(user_payload, LOGIN_USER_KEYS)
    assert_keys_equal(user_payload["customer_profile"], CUSTOMER_PROFILE_KEYS)


def test_profile_get_returns_all_fields(api_client, customer_user):
    api_client.force_authenticate(user=customer_user)
    url = reverse("auth-profile")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, PROFILE_GET_KEYS)
    assert response.data["username"] == customer_user.username


def test_profile_put_returns_all_fields_and_updates_phone(api_client, customer_user):
    api_client.force_authenticate(user=customer_user)
    url = reverse("auth-profile")

    response = api_client.put(
        url,
        {
            "email": "new_email@example.com",
            "first_name": "New",
            "last_name": "Name",
            "phone": "999",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, PROFILE_PUT_KEYS)
    assert_keys_equal(response.data["user"], PROFILE_GET_KEYS)
    assert response.data["user"]["email"] == "new_email@example.com"

    customer_user.refresh_from_db()
    assert Customer.objects.get(user=customer_user).phone == "999"


def test_change_password_fields_and_login_with_new_password(api_client, customer_user):
    api_client.force_authenticate(user=customer_user)
    url = reverse("auth-change-password")

    response = api_client.post(
        url,
        {
            "old_password": "pass1234",
            "new_password": "EvenStrongerPass123!",
            "new_password2": "EvenStrongerPass123!",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, {"message"})

    # Should be able to login with the new password
    api_client.force_authenticate(user=None)
    login_url = reverse("auth-login")
    login = api_client.post(
        login_url,
        {"username": customer_user.username, "password": "EvenStrongerPass123!"},
        format="json",
    )
    assert login.status_code == status.HTTP_200_OK
    assert_keys_equal(login.data, LOGIN_RESPONSE_KEYS)


def test_change_password_mismatch_new_passwords(api_client, customer_user):
    """Test change password when new passwords don't match."""
    api_client.force_authenticate(user=customer_user)
    response = api_client.post(reverse("auth-change-password"), {
        "old_password": "pass1234",
        "new_password": "newpass1234",
        "new_password2": "differentpass",
    })
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "new_password" in str(response.data)


def test_register_password_mismatch(api_client):
    """Test registration when passwords don't match."""
    response = api_client.post(reverse("auth-register"), {
        "username": "testuser2",
        "email": "test2@example.com",
        "password": "pass1234",
        "password2": "differentpass",
        "first_name": "Test",
        "last_name": "User",
        "phone": "123456789",
    })
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "password" in str(response.data)


def test_token_refresh_returns_expected_fields(api_client):
    # Obtain refresh token via register
    username = f"refresh_{uuid.uuid4().hex[:8]}"
    password = "StrongPass123!"
    register_url = reverse("auth-register")
    reg = api_client.post(
        register_url,
        {
            "username": username,
            "password": password,
            "password2": password,
            "email": f"{username}@example.com",
            "first_name": "Ref",
            "last_name": "Resh",
            "phone": "111",
        },
        format="json",
    )
    refresh = reg.data["tokens"]["refresh"]

    url = reverse("token-refresh")
    response = api_client.post(url, {"refresh": refresh}, format="json")

    assert response.status_code == status.HTTP_200_OK
    # Depending on SIMPLE_JWT config, may include new refresh as well.
    assert_keys_superset(response.data, {"access"})


def test_logout_returns_message_field(api_client):
    username = f"logout_{uuid.uuid4().hex[:8]}"
    password = "StrongPass123!"

    register_url = reverse("auth-register")
    reg = api_client.post(
        register_url,
        {
            "username": username,
            "password": password,
            "password2": password,
            "email": f"{username}@example.com",
            "first_name": "Lo",
            "last_name": "Gout",
            "phone": "222",
        },
        format="json",
    )

    access = reg.data["tokens"]["access"]
    refresh = reg.data["tokens"]["refresh"]

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    url = reverse("auth-logout")
    response = api_client.post(url, {"refresh": refresh}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, {"message"})


def test_my_bookings_returns_booking_fields(api_client, customer_user, screening):
    # Ensure booking exists for this user
    Booking.objects.create(
        screening=screening,
        user=customer_user,
        customer_name="Me",
        customer_email="me@example.com",
        customer_phone="000",
        seats_booked=1,
        seat_numbers="C1",
    )

    api_client.force_authenticate(user=customer_user)
    url = reverse("auth-my-bookings")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, PAGINATED_KEYS)
    data = unwrap_results(response.data)
    assert isinstance(data, list)
    assert data, "Expected at least one booking"

    first = data[0]
    assert_keys_equal(first, BOOKING_RESPONSE_FIELDS)
    assert_keys_equal(first["screening_details"], SCREENING_FIELDS)
    assert_keys_equal(first["screening_details"]["movie_details"], MOVIE_FIELDS)


def test_login_missing_fields_returns_400(api_client):
    url = reverse("auth-login")
    response = api_client.post(url, {"username": "x"}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert_keys_equal(response.data, {"error"})


def test_login_invalid_credentials_returns_401(api_client):
    url = reverse("auth-login")
    response = api_client.post(url, {"username": "nope", "password": "nope"}, format="json")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert_keys_equal(response.data, {"error"})


def test_register_duplicate_email_returns_400(api_client):
    url = reverse("auth-register")
    email = f"dup_{uuid.uuid4().hex[:6]}@example.com"

    payload = {
        "username": f"u_{uuid.uuid4().hex[:6]}",
        "password": "StrongPass123!",
        "password2": "StrongPass123!",
        "email": email,
        "first_name": "A",
        "last_name": "B",
        "phone": "1",
    }
    first = api_client.post(url, payload, format="json")
    assert first.status_code == status.HTTP_201_CREATED

    payload2 = dict(payload)
    payload2["username"] = f"u_{uuid.uuid4().hex[:6]}"
    second = api_client.post(url, payload2, format="json")
    assert second.status_code == status.HTTP_400_BAD_REQUEST
    assert "email" in second.data


def test_logout_missing_refresh_returns_400(api_client, customer_user):
    api_client.force_authenticate(user=customer_user)
    url = reverse("auth-logout")
    response = api_client.post(url, {}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert_keys_equal(response.data, {"error"})


def test_logout_invalid_refresh_returns_400(api_client, customer_user):
    api_client.force_authenticate(user=customer_user)
    url = reverse("auth-logout")
    response = api_client.post(url, {"refresh": "not-a-token"}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert_keys_equal(response.data, {"error"})


def test_profile_requires_auth(api_client):
    url = reverse("auth-profile")
    response = api_client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_change_password_wrong_old_password_returns_400(api_client, customer_user):
    api_client.force_authenticate(user=customer_user)
    url = reverse("auth-change-password")
    response = api_client.post(
        url,
        {
            "old_password": "wrong",
            "new_password": "EvenStrongerPass123!",
            "new_password2": "EvenStrongerPass123!",
        },
        format="json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "old_password" in response.data
