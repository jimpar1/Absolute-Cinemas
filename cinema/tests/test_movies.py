"""Integration tests for the Movie API endpoints (CRUD + TMDB integration)."""

import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch

from cinema.models import Movie
from cinema.tests.conftest import MOVIE_FIELDS, SCREENING_FIELDS, assert_keys_equal


pytestmark = pytest.mark.django_db


def _unwrap_results(data):
    if isinstance(data, dict) and "results" in data:
        return data["results"]
    return data


def test_list_movies(api_client, movie, movie_data):
    url = reverse("movie-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = _unwrap_results(response.data)
    assert isinstance(data, list)
    assert_keys_equal(data[0], MOVIE_FIELDS)
    assert len(data) >= 1
    assert movie_data["title"] in [m["title"] for m in data]


def test_retrieve_movie(api_client, movie, movie_data):
    url = reverse("movie-detail", kwargs={"pk": movie.pk})
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, MOVIE_FIELDS)
    assert response.data["title"] == movie_data["title"]


def test_create_movie_disabled(api_client, staff_user, movie_data):
    """Ensure manual creation is disabled (returns 405)."""
    api_client.force_authenticate(user=staff_user)
    url = reverse("movie-list")
    response = api_client.post(url, movie_data, format="json")

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


def test_update_movie(api_client, staff_user, movie, movie_data):
    api_client.force_authenticate(user=staff_user)
    url = reverse("movie-detail", kwargs={"pk": movie.pk})

    updated_data = dict(movie_data)
    updated_data["title"] = "Updated Movie"
    response = api_client.put(url, updated_data, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, MOVIE_FIELDS)
    movie.refresh_from_db()
    assert movie.title == "Updated Movie"


def test_partial_update_movie(api_client, staff_user, movie):
    api_client.force_authenticate(user=staff_user)
    url = reverse("movie-detail", kwargs={"pk": movie.pk})
    response = api_client.patch(url, {"rating": 9.0}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, MOVIE_FIELDS)
    movie.refresh_from_db()
    assert float(movie.rating) == 9.0


def test_delete_movie(api_client, staff_user, movie):
    api_client.force_authenticate(user=staff_user)
    url = reverse("movie-detail", kwargs={"pk": movie.pk})
    response = api_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Movie.objects.count() == 0


def test_movie_detail_404(api_client):
    url = reverse("movie-detail", kwargs={"pk": 999999})
    response = api_client.get(url)
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_movie_update_delete_require_staff_and_model_perms(api_client, user, staff_basic, make_staff_user, movie, movie_data):
    url = reverse("movie-detail", kwargs={"pk": movie.pk})

    # Unauthenticated write -> forbidden
    unauth = api_client.patch(url, {"rating": 9.1}, format="json")
    assert unauth.status_code == status.HTTP_401_UNAUTHORIZED

    # Non-staff -> forbidden
    api_client.force_authenticate(user=user)
    nonstaff = api_client.patch(url, {"rating": 9.1}, format="json")
    assert nonstaff.status_code == status.HTTP_403_FORBIDDEN

    # Staff without change perm -> forbidden
    api_client.force_authenticate(user=staff_basic)
    denied = api_client.patch(url, {"rating": 9.1}, format="json")
    assert denied.status_code == status.HTTP_403_FORBIDDEN

    # Staff with change_movie -> ok
    staff_change = make_staff_user(perm_codenames=["change_movie"])
    api_client.force_authenticate(user=staff_change)
    ok = api_client.patch(url, {"rating": 9.1}, format="json")
    assert ok.status_code == status.HTTP_200_OK

    # Delete requires delete_movie
    api_client.force_authenticate(user=staff_basic)
    denied_del = api_client.delete(url)
    assert denied_del.status_code == status.HTTP_403_FORBIDDEN

    staff_delete = make_staff_user(perm_codenames=["delete_movie"])
    api_client.force_authenticate(user=staff_delete)
    ok_del = api_client.delete(url)
    assert ok_del.status_code == status.HTTP_204_NO_CONTENT


def test_movie_refresh_from_tmdb_requires_change_perm(api_client, staff_basic, make_staff_user, movie):
    url = reverse("movie-detail", kwargs={"pk": movie.pk})

    api_client.force_authenticate(user=staff_basic)
    denied = api_client.post(f"{url}refresh_from_tmdb/")
    assert denied.status_code == status.HTTP_403_FORBIDDEN

    staff_change = make_staff_user(perm_codenames=["change_movie"])
    api_client.force_authenticate(user=staff_change)

    with patch("cinema.services.movie_service.MovieService.refresh_movie_from_tmdb") as mock_refresh:
        mock_refresh.return_value = {"trailer_url": "http://x", "shots": [], "actors": []}
        ok = api_client.post(f"{url}refresh_from_tmdb/")
        assert ok.status_code == status.HTTP_200_OK


def test_screenings_action(api_client, movie):
    url = reverse("movie-detail", kwargs={"pk": movie.pk})
    response = api_client.get(f"{url}screenings/")

    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, list)
    if response.data:
        assert_keys_equal(response.data[0], SCREENING_FIELDS)


@patch("cinema.services.movie_service.MovieService.search_tmdb")
def test_search_tmdb(mock_search, api_client):
    mock_search.return_value = {"results": [{"id": 123, "title": "TMDB Movie"}]}
    url = reverse("movie-list")
    response = api_client.get(f"{url}search_tmdb/?query=test")

    assert response.status_code == status.HTTP_200_OK


@patch("cinema.services.movie_service.MovieService.popular_tmdb")
def test_popular_tmdb(mock_popular, api_client):
    mock_popular.return_value = {"results": [{"id": 123, "title": "Popular Movie"}]}
    url = reverse("movie-list")
    response = api_client.get(f"{url}popular_tmdb/")

    assert response.status_code == status.HTTP_200_OK


@patch("cinema.services.movie_service.MovieService.tmdb_details")
def test_tmdb_details(mock_details, api_client):
    mock_details.return_value = {"title": "TMDB Details"}
    url = reverse("movie-list")
    response = api_client.get(f"{url}tmdb_details/?movie_id=123")

    assert response.status_code == status.HTTP_200_OK


@patch("cinema.services.movie_service.MovieService.refresh_movie_from_tmdb")
def test_refresh_from_tmdb(mock_refresh, api_client, staff_user, movie):
    api_client.force_authenticate(user=staff_user)
    mock_refresh.return_value = {"trailer_url": "http://new.trailer", "shots": [], "actors": []}

    url = reverse("movie-detail", kwargs={"pk": movie.pk})
    response = api_client.post(f"{url}refresh_from_tmdb/")

    assert response.status_code == status.HTTP_200_OK
    assert_keys_equal(response.data, MOVIE_FIELDS)
    movie.refresh_from_db()
    assert movie.trailer_url == "http://new.trailer"


@patch("cinema.services.movie_service.MovieService.build_movie_data_from_tmdb_id")
def test_create_from_tmdb(mock_build, api_client, staff_user):
    api_client.force_authenticate(user=staff_user)
    mock_build.return_value = {
        "title": "New Movie",
        "description": "Desc",
        "duration": 100,
        "genre": "Action",
        "director": "Dir",
        "release_year": 2023,
        "rating": 7.5,
        "poster_url": "http://example.com/poster.jpg",
        "trailer_url": "http://example.com/trailer.mp4",
        "shots": [],
        "actors": [],
    }

    url = reverse("movie-list")
    response = api_client.post(f"{url}create_from_tmdb/", {"tmdb_id": 123}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert_keys_equal(response.data, MOVIE_FIELDS)


@patch("cinema.services.movie_service.MovieService.search_tmdb")
@patch("cinema.services.movie_service.MovieService.build_movie_data_from_tmdb_id")
def test_create_from_search(mock_build, mock_search, api_client, staff_user):
    api_client.force_authenticate(user=staff_user)
    mock_search.return_value = {"results": [{"id": 123}]}
    mock_build.return_value = {
        "title": "New Movie",
        "description": "Desc",
        "duration": 100,
        "genre": "Action",
        "director": "Dir",
        "release_year": 2023,
        "rating": 7.5,
        "poster_url": "http://example.com/poster.jpg",
        "trailer_url": "http://example.com/trailer.mp4",
        "shots": [],
        "actors": [],
    }

    url = reverse("movie-list")
    response = api_client.post(f"{url}create_from_search/", {"query": "test"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert_keys_equal(response.data, MOVIE_FIELDS)
