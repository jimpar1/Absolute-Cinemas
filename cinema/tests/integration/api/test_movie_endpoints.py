"""Integration tests for the Movie API endpoints (CRUD + TMDB integration)."""

import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch, Mock

from cinema.models import Movie
from cinema.tests.conftest import MOVIE_FIELDS, SCREENING_FIELDS, assert_keys_equal, unwrap_results


pytestmark = pytest.mark.django_db


def test_list_movies(api_client, movie, movie_data):
    url = reverse("movie-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = unwrap_results(response.data)
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


@patch("cinema.services.movie_service.MovieService.search_tmdb")
def test_search_tmdb_error_handling(mock_search, api_client):
    """Test search_tmdb error handling when service raises error."""
    from cinema.services.errors import ServiceError
    mock_search.side_effect = ServiceError('Search failed', status_code=500)

    url = reverse("movie-list")
    response = api_client.get(f"{url}search_tmdb/?query=test")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert 'error' in response.data


@patch("cinema.services.movie_service.MovieService.search_tmdb")
def test_search_tmdb_with_list_response(mock_search, api_client):
    """Test search_tmdb when service returns a list instead of dict."""
    mock_search.return_value = [{'id': 123, 'title': 'Movie'}]

    url = reverse("movie-list")
    response = api_client.get(f"{url}search_tmdb/?query=test&page=2")

    assert response.status_code == status.HTTP_200_OK
    assert 'results' in response.data


@patch("cinema.services.movie_service.MovieService.popular_tmdb")
def test_popular_tmdb_with_list_response(mock_popular, api_client):
    """Test popular_tmdb when service returns a list instead of dict."""
    mock_popular.return_value = [{'id': 456, 'title': 'Popular'}]

    url = reverse("movie-list")
    response = api_client.get(f"{url}popular_tmdb/?page=3")

    assert response.status_code == status.HTTP_200_OK
    assert 'results' in response.data


@patch("cinema.services.movie_service.MovieService.tmdb_details")
def test_tmdb_details_invalid_response(mock_details, api_client):
    """Test tmdb_details when service returns invalid response format."""
    # Return something that's not dict and doesn't have __dict__
    mock_details.return_value = "invalid"

    url = reverse("movie-list")
    response = api_client.get(f"{url}tmdb_details/?movie_id=123")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert 'error' in response.data



def test_tmdb_details_missing_movie_id(api_client):
    """Test tmdb_details without movie_id parameter."""
    url = reverse("movie-list")
    response = api_client.get(f"{url}tmdb_details/")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'error' in response.data


@patch("cinema.services.movie_service.MovieService.tmdb_details")
def test_tmdb_details_error_handling(mock_details, api_client):
    """Test tmdb_details error handling."""
    from cinema.services.errors import ServiceError
    mock_details.side_effect = ServiceError('Not found', status_code=404)

    url = reverse("movie-list")
    response = api_client.get(f"{url}tmdb_details/?movie_id=999")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert 'error' in response.data



@patch("cinema.services.movie_service.MovieService.refresh_movie_from_tmdb")
def test_refresh_from_tmdb_error_handling(mock_refresh, api_client, staff_user, movie):
    """Test refresh_from_tmdb error handling."""
    from cinema.services.errors import ServiceError
    api_client.force_authenticate(user=staff_user)
    mock_refresh.side_effect = ServiceError('TMDB error', status_code=500)

    url = reverse("movie-detail", kwargs={"pk": movie.pk})
    response = api_client.post(f"{url}refresh_from_tmdb/")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert 'error' in response.data


def test_create_from_tmdb_missing_tmdb_id(api_client, staff_user):
    """Test create_from_tmdb without tmdb_id."""
    api_client.force_authenticate(user=staff_user)

    url = reverse("movie-list")
    response = api_client.post(f"{url}create_from_tmdb/", {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'error' in response.data


def test_create_from_tmdb_invalid_tmdb_id(api_client, staff_user):
    """Test create_from_tmdb with invalid tmdb_id."""
    api_client.force_authenticate(user=staff_user)

    url = reverse("movie-list")
    response = api_client.post(f"{url}create_from_tmdb/", {"tmdb_id": "invalid"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'error' in response.data


@patch("cinema.services.movie_service.MovieService.build_movie_data_from_tmdb_id")
def test_create_from_tmdb_service_error(mock_build, api_client, staff_user):
    """Test create_from_tmdb when service raises error."""
    from cinema.services.errors import ServiceError
    api_client.force_authenticate(user=staff_user)
    mock_build.side_effect = ServiceError('Not found', status_code=404)

    url = reverse("movie-list")
    response = api_client.post(f"{url}create_from_tmdb/", {"tmdb_id": 999}, format="json")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert 'error' in response.data


@patch("cinema.services.movie_service.MovieService.build_movie_data_from_tmdb_id")
def test_create_from_tmdb_validation_error(mock_build, api_client, staff_user):
    """Test create_from_tmdb when serializer validation fails."""
    api_client.force_authenticate(user=staff_user)
    mock_build.return_value = {
        "title": "",  # Invalid - empty title
        "duration": -1,  # Invalid - negative duration
    }

    url = reverse("movie-list")
    response = api_client.post(f"{url}create_from_tmdb/", {"tmdb_id": 123}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_create_from_search_missing_query(api_client, staff_user):
    """Test create_from_search without query."""
    api_client.force_authenticate(user=staff_user)

    url = reverse("movie-list")
    response = api_client.post(f"{url}create_from_search/", {}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'error' in response.data


@patch("cinema.services.movie_service.MovieService.search_tmdb")
def test_create_from_search_no_results(mock_search, api_client, staff_user):
    """Test create_from_search when no movies found."""
    api_client.force_authenticate(user=staff_user)
    mock_search.return_value = {"results": []}

    url = reverse("movie-list")
    response = api_client.post(f"{url}create_from_search/", {"query": "nonexistent"}, format="json")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert 'error' in response.data


@patch("cinema.services.movie_service.MovieService.search_tmdb")
def test_create_from_search_service_error(mock_search, api_client, staff_user):
    """Test create_from_search when search service raises error."""
    from cinema.services.errors import ServiceError
    api_client.force_authenticate(user=staff_user)
    mock_search.side_effect = ServiceError('Search failed', status_code=500)

    url = reverse("movie-list")
    response = api_client.post(f"{url}create_from_search/", {"query": "test"}, format="json")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert 'error' in response.data


@patch("cinema.services.movie_service.MovieService.search_tmdb")
@patch("cinema.services.movie_service.MovieService.build_movie_data_from_tmdb_id")
def test_create_from_search_build_error(mock_build, mock_search, api_client, staff_user):
    """Test create_from_search when build service raises error."""
    from cinema.services.errors import ServiceError
    api_client.force_authenticate(user=staff_user)
    mock_search.return_value = {"results": [{"id": 123}]}
    mock_build.side_effect = ServiceError('Build failed', status_code=500)

    url = reverse("movie-list")
    response = api_client.post(f"{url}create_from_search/", {"query": "test"}, format="json")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert 'error' in response.data


@patch("cinema.services.movie_service.MovieService.search_tmdb")
@patch("cinema.services.movie_service.MovieService.build_movie_data_from_tmdb_id")
def test_create_from_search_serializer_error(mock_build, mock_search, api_client, staff_user):
    """Test create_from_search when serializer validation fails."""
    api_client.force_authenticate(user=staff_user)
    mock_search.return_value = {"results": [{"id": 123}]}
    mock_build.return_value = {
        "title": "",  # Invalid
        "duration": -1,  # Invalid
    }

    url = reverse("movie-list")
    response = api_client.post(f"{url}create_from_search/", {"query": "test"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# SEARCH, FILTER, AND ORDERING TESTS
# ============================================================================


class TestMovieSearch:
    """Tests for movie search functionality."""

    def test_search_movies_by_title(self, api_client, make_movie):
        """Test searching movies by title (case-insensitive)."""
        make_movie(title="The Matrix")
        make_movie(title="The Avengers")
        make_movie(title="Inception")

        url = reverse("movie-list")
        response = api_client.get(url, {"search": "Matrix"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) == 1
        assert data[0]["title"] == "The Matrix"

    def test_search_movies_case_insensitive(self, api_client, make_movie):
        """Test search is case-insensitive."""
        make_movie(title="The Matrix")

        url = reverse("movie-list")
        response = api_client.get(url, {"search": "matrix"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) == 1
        assert data[0]["title"] == "The Matrix"

    def test_search_movies_by_director(self, api_client, make_movie):
        """Test searching movies by director name."""
        make_movie(title="Movie 1", director="Christopher Nolan")
        make_movie(title="Movie 2", director="Steven Spielberg")

        url = reverse("movie-list")
        response = api_client.get(url, {"search": "Nolan"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) == 1
        assert data[0]["director"] == "Christopher Nolan"

    def test_search_movies_by_genre(self, api_client, make_movie):
        """Test searching movies by genre."""
        make_movie(title="Sci-Fi Movie", genre="Science Fiction")
        make_movie(title="Action Movie", genre="Action")

        url = reverse("movie-list")
        response = api_client.get(url, {"search": "Science"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) == 1
        assert data[0]["genre"] == "Science Fiction"

    def test_search_movies_partial_match(self, api_client, make_movie):
        """Test search finds partial matches."""
        make_movie(title="The Dark Knight")
        make_movie(title="A Beautiful Mind")

        url = reverse("movie-list")
        response = api_client.get(url, {"search": "Dark"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) == 1
        assert "Dark" in data[0]["title"]

    def test_search_movies_no_results(self, api_client, make_movie):
        """Test search with no matches returns empty list."""
        make_movie(title="Movie One")

        url = reverse("movie-list")
        response = api_client.get(url, {"search": "NonexistentMovie"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) == 0

    def test_search_movies_empty_query_returns_all(self, api_client, make_movie):
        """Test empty search query returns all movies."""
        make_movie(title="Movie 1")
        make_movie(title="Movie 2")

        url = reverse("movie-list")
        response = api_client.get(url, {"search": ""})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) >= 2


class TestMovieOrdering:
    """Tests for movie ordering functionality."""

    def test_order_movies_by_title_ascending(self, api_client, make_movie):
        """Test ordering movies by title (A-Z)."""
        make_movie(title="Zebra Movie")
        make_movie(title="Alpha Movie")
        make_movie(title="Beta Movie")

        url = reverse("movie-list")
        response = api_client.get(url, {"ordering": "title"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        titles = [m["title"] for m in data]
        assert titles == sorted(titles)
        assert titles[0] == "Alpha Movie"

    def test_order_movies_by_title_descending(self, api_client, make_movie):
        """Test ordering movies by title (Z-A)."""
        make_movie(title="Zebra Movie")
        make_movie(title="Alpha Movie")

        url = reverse("movie-list")
        response = api_client.get(url, {"ordering": "-title"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        titles = [m["title"] for m in data]
        assert titles[0] == "Zebra Movie"

    def test_order_movies_by_rating_descending(self, api_client, make_movie):
        """Test ordering movies by rating (highest first)."""
        make_movie(title="Low Rated", rating=5.0)
        make_movie(title="High Rated", rating=9.5)
        make_movie(title="Mid Rated", rating=7.0)

        url = reverse("movie-list")
        response = api_client.get(url, {"ordering": "-rating"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        ratings = [float(m["rating"]) if m["rating"] else 0 for m in data]
        # First should be highest rated
        assert data[0]["title"] == "High Rated"

    def test_order_movies_by_rating_ascending(self, api_client, make_movie):
        """Test ordering movies by rating (lowest first)."""
        make_movie(title="Low Rated", rating=3.0)
        make_movie(title="High Rated", rating=9.0)

        url = reverse("movie-list")
        response = api_client.get(url, {"ordering": "rating"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        # First should be lowest rated (or null)
        non_null_movies = [m for m in data if m["rating"] is not None]
        if non_null_movies:
            assert non_null_movies[0]["title"] == "Low Rated"

    def test_order_movies_by_release_year(self, api_client, make_movie):
        """Test ordering movies by release year."""
        make_movie(title="Old Movie", release_year=1990)
        make_movie(title="New Movie", release_year=2023)
        make_movie(title="Mid Movie", release_year=2010)

        url = reverse("movie-list")
        response = api_client.get(url, {"ordering": "release_year"})

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        years = [m["release_year"] for m in data]
        assert years[0] == 1990

    def test_order_movies_by_created_at_default(self, api_client, make_movie):
        """Test default ordering is by created_at descending (newest first)."""
        movie1 = make_movie(title="First Created")
        movie2 = make_movie(title="Second Created")

        url = reverse("movie-list")
        response = api_client.get(url)  # No ordering param

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        # Default ordering is -created_at, so newest should be first
        assert data[0]["title"] == "Second Created"

    def test_order_movies_invalid_field_ignored(self, api_client, make_movie):
        """Test ordering by invalid field is ignored (returns default order)."""
        make_movie(title="Movie 1")
        make_movie(title="Movie 2")

        url = reverse("movie-list")
        response = api_client.get(url, {"ordering": "invalid_field"})

        assert response.status_code == status.HTTP_200_OK
        # Should not crash, just ignore invalid ordering


class TestMovieCombinedSearchAndOrdering:
    """Tests combining search and ordering."""

    def test_search_and_order_combined(self, api_client, make_movie):
        """Test searching and ordering can be combined."""
        make_movie(title="Action Movie Z", genre="Action", rating=8.0)
        make_movie(title="Action Movie A", genre="Action", rating=9.0)
        make_movie(title="Drama Movie", genre="Drama", rating=7.0)

        url = reverse("movie-list")
        response = api_client.get(url, {
            "search": "Action",
            "ordering": "-rating"
        })

        assert response.status_code == status.HTTP_200_OK
        data = unwrap_results(response.data)
        assert len(data) == 2
        # Both should be Action genre
        assert all("Action" in m["genre"] for m in data)
        # Should be ordered by rating descending
        assert data[0]["title"] == "Action Movie A"
