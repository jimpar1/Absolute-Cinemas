"""Integration tests for the MovieHall API endpoints (CRUD)."""

import pytest
from django.urls import reverse
from rest_framework import status

from cinema.models import MovieHall
from cinema.tests.conftest import MOVIE_HALL_FIELDS, assert_keys_equal, unwrap_results


pytestmark = pytest.mark.django_db


def test_list_movie_halls(api_client, hall):
    url = reverse("moviehall-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = unwrap_results(response.data)
    assert isinstance(data, list)
    assert_keys_equal(data[0], MOVIE_HALL_FIELDS)
    assert len(data) >= 1
    assert hall.name in [h["name"] for h in data]


def test_retrieve_movie_hall(api_client, hall):
    url = reverse("moviehall-detail", kwargs={"pk": hall.pk})
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, MOVIE_HALL_FIELDS)
    assert response.data["name"] == hall.name


def test_create_movie_hall(api_client, staff_user, hall):
    api_client.force_authenticate(user=staff_user)
    url = reverse("moviehall-list")
    response = api_client.post(url, {"name": "Hall 2", "capacity": 150}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert_keys_equal(response.data, MOVIE_HALL_FIELDS)
    assert MovieHall.objects.count() == 2


def test_update_movie_hall(api_client, staff_user, hall):
    api_client.force_authenticate(user=staff_user)
    url = reverse("moviehall-detail", kwargs={"pk": hall.pk})
    response = api_client.put(url, {"name": "Updated Hall", "capacity": 120}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, MOVIE_HALL_FIELDS)
    hall.refresh_from_db()
    assert hall.name == "Updated Hall"


def test_partial_update_movie_hall(api_client, staff_user, hall):
    """Patch the hall name — capacity is auto-computed and not directly writable."""
    api_client.force_authenticate(user=staff_user)
    url = reverse("moviehall-detail", kwargs={"pk": hall.pk})
    response = api_client.patch(url, {"name": "Renamed Hall"}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, MOVIE_HALL_FIELDS)
    hall.refresh_from_db()
    assert hall.name == "Renamed Hall"


def test_delete_movie_hall(api_client, staff_user, hall):
    api_client.force_authenticate(user=staff_user)
    url = reverse("moviehall-detail", kwargs={"pk": hall.pk})
    response = api_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert MovieHall.objects.count() == 0


def test_movie_hall_write_requires_staff_and_model_perms(api_client, user, staff_basic, make_staff_user):
    url = reverse("moviehall-list")
    payload = {"name": "Hall X", "capacity": 10}

    # Unauthenticated -> forbidden
    unauth = api_client.post(url, payload, format="json")
    assert unauth.status_code == status.HTTP_401_UNAUTHORIZED

    # Authenticated non-staff -> forbidden
    api_client.force_authenticate(user=user)
    nonstaff = api_client.post(url, payload, format="json")
    assert nonstaff.status_code == status.HTTP_403_FORBIDDEN

    # Staff but without perms -> forbidden
    api_client.force_authenticate(user=staff_basic)
    staff_no_perms = api_client.post(url, payload, format="json")
    assert staff_no_perms.status_code == status.HTTP_403_FORBIDDEN

    # Staff with add_moviehall -> allowed
    staff_with = make_staff_user(perm_codenames=["add_moviehall"])
    api_client.force_authenticate(user=staff_with)
    ok = api_client.post(url, payload, format="json")
    assert ok.status_code == status.HTTP_201_CREATED


def test_movie_hall_update_delete_require_change_delete_perms(api_client, staff_basic, make_staff_user, hall):
    detail = reverse("moviehall-detail", kwargs={"pk": hall.pk})

    api_client.force_authenticate(user=staff_basic)
    no_change = api_client.patch(detail, {"name": "Nope"}, format="json")
    assert no_change.status_code == status.HTTP_403_FORBIDDEN

    staff_change = make_staff_user(perm_codenames=["change_moviehall"])
    api_client.force_authenticate(user=staff_change)
    ok = api_client.patch(detail, {"name": "Yep"}, format="json")
    assert ok.status_code == status.HTTP_200_OK

    api_client.force_authenticate(user=staff_basic)
    no_delete = api_client.delete(detail)
    assert no_delete.status_code == status.HTTP_403_FORBIDDEN

    staff_delete = make_staff_user(perm_codenames=["delete_moviehall"])
    api_client.force_authenticate(user=staff_delete)
    ok_del = api_client.delete(detail)
    assert ok_del.status_code == status.HTTP_204_NO_CONTENT
