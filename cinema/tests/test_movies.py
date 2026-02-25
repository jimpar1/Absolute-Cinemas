"""Tests for the Movie API endpoints (CRUD + TMDB integration)."""

from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth.models import User
from unittest.mock import patch
from cinema.models import Movie, MovieHall


class MovieAPITestCase(APITestCase):
    """Verify list, retrieve, update, delete, and TMDB custom actions for movies."""

    def setUp(self):
        Movie.objects.all().delete()
        MovieHall.objects.all().delete()
        User.objects.all().delete()

        # Use superuser to bypass permission checks for admin actions
        self.staff_user = User.objects.create_superuser(username='staff', password='pass1234', email='staff@example.com')

        self.hall = MovieHall.objects.create(name='Hall 1', capacity=100)
        self.movie_data = {
            'title': 'Test Movie', 'description': 'Test Description',
            'duration': 120, 'genre': 'Action', 'director': 'Test Director',
            'release_year': 2023, 'rating': 8.5, 'status': 'now_playing',
            'poster_url': 'http://example.com/poster.jpg',
            'trailer_url': 'http://example.com/trailer.mp4',
            'shots': ['http://example.com/shot1.jpg'],
            'actors': [{'name': 'Actor 1', 'character': 'Role 1'}]
        }
        self.movie = Movie.objects.create(**self.movie_data)
        self.url_list = reverse('movie-list')
        self.url_detail = reverse('movie-detail', kwargs={'pk': self.movie.pk})

    def test_list_movies(self):
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle both paginated and non-paginated responses
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertGreaterEqual(len(data), 1)
        movie_titles = [m['title'] for m in data]
        self.assertIn(self.movie_data['title'], movie_titles)

    def test_retrieve_movie(self):
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.movie_data['title'])

    def test_create_movie_disabled(self):
        """Ensure manual creation is disabled (returns 405)."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post(self.url_list, self.movie_data, format='json')
        # If the viewset is ReadOnlyModelViewSet or similar, it should be 405.
        # If it's a ModelViewSet but we want to forbid standard creation, we'd expect 405.
        # Let's keep the assertion as is, assuming the intention is to forbid standard creation.
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_update_movie(self):
        self.client.force_authenticate(user=self.staff_user)
        updated_data = self.movie_data.copy()
        updated_data['title'] = 'Updated Movie'
        response = self.client.put(self.url_detail, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.movie.refresh_from_db()
        self.assertEqual(self.movie.title, 'Updated Movie')

    def test_partial_update_movie(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.patch(self.url_detail, {'rating': 9.0}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.movie.refresh_from_db()
        self.assertEqual(self.movie.rating, 9.0)

    def test_delete_movie(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Movie.objects.count(), 0)

    def test_screenings_action(self):
        response = self.client.get(f'{self.url_detail}screenings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('cinema.services.movie_service.MovieService.search_tmdb')
    def test_search_tmdb(self, mock_search):
        mock_search.return_value = {'results': [{'id': 123, 'title': 'TMDB Movie'}]}
        response = self.client.get(f'{self.url_list}search_tmdb/?query=test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('cinema.services.movie_service.MovieService.popular_tmdb')
    def test_popular_tmdb(self, mock_popular):
        mock_popular.return_value = {'results': [{'id': 123, 'title': 'Popular Movie'}]}
        response = self.client.get(f'{self.url_list}popular_tmdb/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('cinema.services.movie_service.MovieService.tmdb_details')
    def test_tmdb_details(self, mock_details):
        mock_details.return_value = {'title': 'TMDB Details'}
        response = self.client.get(f'{self.url_list}tmdb_details/?movie_id=123')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('cinema.services.movie_service.MovieService.refresh_movie_from_tmdb')
    def test_refresh_from_tmdb(self, mock_refresh):
        self.client.force_authenticate(user=self.staff_user)
        mock_refresh.return_value = {
            'trailer_url': 'http://new.trailer',
            'shots': [],
            'actors': []
        }
        response = self.client.post(f'{self.url_detail}refresh_from_tmdb/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.movie.refresh_from_db()
        self.assertEqual(self.movie.trailer_url, 'http://new.trailer')

    @patch('cinema.services.movie_service.MovieService.build_movie_data_from_tmdb_id')
    def test_create_from_tmdb(self, mock_build):
        self.client.force_authenticate(user=self.staff_user)
        # Use valid URLs for URLFields
        mock_build.return_value = {
            'title': 'New Movie', 'description': 'Desc', 'duration': 100, 'genre': 'Action',
            'director': 'Dir', 'release_year': 2023, 'rating': 7.5, 'poster_url': 'http://example.com/poster.jpg',
            'trailer_url': 'http://example.com/trailer.mp4', 'shots': [], 'actors': []
        }
        response = self.client.post(f'{self.url_list}create_from_tmdb/', {'tmdb_id': 123}, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Create from TMDB failed: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    @patch('cinema.services.movie_service.MovieService.search_tmdb')
    @patch('cinema.services.movie_service.MovieService.build_movie_data_from_tmdb_id')
    def test_create_from_search(self, mock_build, mock_search):
        self.client.force_authenticate(user=self.staff_user)
        mock_search.return_value = {'results': [{'id': 123}]}
        # Use valid URLs for URLFields
        mock_build.return_value = {
            'title': 'New Movie', 'description': 'Desc', 'duration': 100, 'genre': 'Action',
            'director': 'Dir', 'release_year': 2023, 'rating': 7.5, 'poster_url': 'http://example.com/poster.jpg',
            'trailer_url': 'http://example.com/trailer.mp4', 'shots': [], 'actors': []
        }
        response = self.client.post(f'{self.url_list}create_from_search/', {'query': 'test'}, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Create from search failed: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
