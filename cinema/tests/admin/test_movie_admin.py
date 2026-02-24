"""Tests for MovieAdmin custom views and functionality."""

import pytest
from unittest.mock import patch, Mock
from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import User
from django.test import RequestFactory

from cinema.admin.movie_admin import MovieAdmin, TMDBSearchForm
from cinema.models import Movie


@pytest.mark.django_db
class TestMovieAdmin:
    """Test MovieAdmin custom views and functionality."""

    @pytest.fixture
    def admin_user(self):
        """Create a superuser for admin access."""
        return User.objects.create_superuser(
            username='admin',
            password='admin123',
            email='admin@test.com'
        )

    @pytest.fixture
    def movie_admin(self):
        """Create MovieAdmin instance."""
        site = AdminSite()
        return MovieAdmin(Movie, site)

    @pytest.fixture
    def factory(self):
        """Request factory for creating mock requests."""
        return RequestFactory()

    def test_tmdb_search_form_valid(self):
        """Test TMDBSearchForm with valid data."""
        form = TMDBSearchForm(data={'query': 'Test Movie'})
        assert form.is_valid()
        assert form.cleaned_data['query'] == 'Test Movie'

    def test_tmdb_search_form_empty(self):
        """Test TMDBSearchForm with empty data."""
        form = TMDBSearchForm(data={'query': ''})
        assert not form.is_valid()

    def test_movie_admin_list_display(self, movie_admin):
        """Test MovieAdmin list display configuration."""
        assert 'title' in movie_admin.list_display
        assert 'director' in movie_admin.list_display
        assert 'rating' in movie_admin.list_display

    def test_movie_admin_has_add_permission(self, movie_admin, factory, admin_user):
        """Test that admin has add permission."""
        request = factory.get('/admin/cinema/movie/add/')
        request.user = admin_user
        assert movie_admin.has_add_permission(request) is True

    def test_movie_admin_add_view_redirects(self, movie_admin, factory, admin_user):
        """Test that default add view redirects to TMDB import."""
        request = factory.get('/admin/cinema/movie/add/')
        request.user = admin_user

        response = movie_admin.add_view(request)

        assert response.status_code == 302
        assert 'add_from_tmdb' in response.url

    @patch('cinema.tmdb_service.search_movies')
    def test_add_from_tmdb_view_get(self, mock_search, movie_admin, factory, admin_user):
        """Test GET request to add_from_tmdb view shows form."""
        request = factory.get('/admin/cinema/movie/add_from_tmdb/')
        request.user = admin_user

        response = movie_admin.add_from_tmdb_view(request)

        assert response.status_code == 200
        assert b'Add Movie from TMDB' in response.content

    @patch('cinema.tmdb_service.search_movies')
    def test_add_from_tmdb_view_search(self, mock_search, movie_admin, factory, admin_user):
        """Test POST with search query returns results."""
        mock_search.return_value = {
            'results': [
                {'id': 123, 'title': 'Test Movie', 'release_date': '2024-01-01'}
            ]
        }

        request = factory.post('/admin/cinema/movie/add_from_tmdb/', {'query': 'Test Movie'})
        request.user = admin_user

        # Mock the admin_site.each_context to return a dict instead of Mock
        movie_admin.admin_site.each_context = lambda r: {}

        response = movie_admin.add_from_tmdb_view(request)

        assert response.status_code == 200
        mock_search.assert_called_once_with('Test Movie')

    @patch('cinema.tmdb_service.get_movie_details')
    def test_add_from_tmdb_view_create_movie(self, mock_details, movie_admin, factory, admin_user):
        """Test creating a movie from TMDB ID."""
        mock_details.return_value = {
            'title': 'New TMDB Movie',
            'overview': 'A great movie',
            'runtime': 120,
            'genres': [{'name': 'Action'}],
            'release_date': '2024-01-01',
            'vote_average': 8.5,
            'poster_path': '/poster.jpg',
            'videos': {'results': [{'type': 'Trailer', 'site': 'YouTube', 'key': 'abc123'}]},
            'images': {'backdrops': [{'file_path': '/shot1.jpg'}]},
            'credits': {
                'crew': [{'job': 'Director', 'name': 'John Director'}],
                'cast': [{'name': 'Actor One', 'character': 'Hero', 'profile_path': '/actor.jpg'}]
            }
        }

        request = factory.post('/admin/cinema/movie/add_from_tmdb/', {'tmdb_id': '123'})
        request.user = admin_user
        request._messages = Mock()

        response = movie_admin.add_from_tmdb_view(request)

        assert response.status_code == 302
        assert Movie.objects.filter(title='New TMDB Movie').exists()

        movie = Movie.objects.get(title='New TMDB Movie')
        assert movie.director == 'John Director'
        assert movie.duration == 120
        assert movie.trailer_url == 'https://www.youtube.com/watch?v=abc123'

    @patch('cinema.tmdb_service.get_movie_details')
    def test_create_from_tmdb_not_found(self, mock_details, movie_admin, admin_user):
        """Test creating movie when TMDB returns None."""
        from django.test import Client
        mock_details.return_value = None

        client = Client()
        client.force_login(admin_user)

        response = client.post('/admin/cinema/movie/add_from_tmdb/', {'tmdb_id': '999'})

        # Should show error message, no movie created
        assert Movie.objects.count() == 0

    @patch('cinema.tmdb_service.get_movie_details')
    def test_create_from_tmdb_no_title(self, mock_details, movie_admin, admin_user):
        """Test validation when movie has no title."""
        from django.test import Client
        mock_details.return_value = {
            'title': '',
            'overview': 'Desc',
            'runtime': 100,
            'genres': [{'name': 'Action'}],
            'release_date': '2024-01-01',
            'vote_average': 7.0,
            'credits': {'crew': []},
            'videos': {'results': []},
            'images': {'backdrops': []},
        }

        client = Client()
        client.force_login(admin_user)

        response = client.post('/admin/cinema/movie/add_from_tmdb/', {'tmdb_id': '123'})

        assert Movie.objects.count() == 0

    @patch('cinema.tmdb_service.get_movie_details')
    def test_create_from_tmdb_invalid_duration(self, mock_details, movie_admin, admin_user):
        """Test validation when duration is invalid."""
        from django.test import Client
        mock_details.return_value = {
            'title': 'Invalid Movie',
            'overview': 'Desc',
            'runtime': 0,
            'genres': [{'name': 'Action'}],
            'release_date': '2024-01-01',
            'vote_average': 7.0,
            'credits': {'crew': []},
            'videos': {'results': []},
            'images': {'backdrops': []},
        }

        client = Client()
        client.force_login(admin_user)

        response = client.post('/admin/cinema/movie/add_from_tmdb/', {'tmdb_id': '123'})

        assert Movie.objects.count() == 0

    @patch('cinema.tmdb_service.get_movie_details')
    def test_create_from_tmdb_sets_defaults(self, mock_details, movie_admin, factory, admin_user):
        """Test that missing genre/director get default values."""
        mock_details.return_value = {
            'title': 'Minimal Movie',
            'overview': 'Desc',
            'runtime': 90,
            'genres': [],
            'release_date': '2024-01-01',
            'vote_average': 7.0,
            'credits': {'crew': []},
            'videos': {'results': []},
            'images': {'backdrops': []},
        }

        request = factory.post('/admin/cinema/movie/add_from_tmdb/', {'tmdb_id': '123'})
        request.user = admin_user
        request._messages = Mock()

        response = movie_admin.add_from_tmdb_view(request)

        movie = Movie.objects.get(title='Minimal Movie')
        assert movie.genre == 'Unknown'
        assert movie.director == 'Unknown'

    def test_get_director_from_credits(self, movie_admin):
        """Test director extraction helper."""
        credits = {
            'crew': [
                {'job': 'Producer', 'name': 'Jane'},
                {'job': 'Director', 'name': 'John'},
            ]
        }

        director = movie_admin._get_director_from_credits(credits)
        assert director == 'John'

    def test_get_director_from_credits_not_found(self, movie_admin):
        """Test director extraction when not found."""
        credits = {'crew': [{'job': 'Producer', 'name': 'Jane'}]}

        director = movie_admin._get_director_from_credits(credits)
        assert director == 'Unknown'

        director = movie_admin._get_director_from_credits(None)
        assert director == 'Unknown'
