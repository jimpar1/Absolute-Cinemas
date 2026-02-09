from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import Movie, Screening, Booking, MovieHall
from django.contrib.auth.models import User
from unittest.mock import patch
from django.utils import timezone


class MovieHallAPITestCase(APITestCase):
    def setUp(self):
        # Clear existing data
        MovieHall.objects.all().delete()
        User.objects.all().delete()

        self.staff_user = User.objects.create_user(username='staff', password='pass1234')
        self.staff_user.is_staff = True
        self.staff_user.save()

        self.hall_data = {'name': 'Hall 1', 'capacity': 100}
        self.hall = MovieHall.objects.create(**self.hall_data)
        self.url_list = reverse('moviehall-list')
        self.url_detail = reverse('moviehall-detail', kwargs={'pk': self.hall.pk})

    def test_list_movie_halls(self):
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle both paginated and non-paginated responses
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertGreaterEqual(len(data), 1)
        # Check that our created hall is in the response
        hall_names = [h['name'] for h in data]
        self.assertIn(self.hall_data['name'], hall_names)

    def test_retrieve_movie_hall(self):
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.hall_data['name'])

    def test_create_movie_hall(self):
        self.client.force_authenticate(user=self.staff_user)
        new_hall_data = {'name': 'Hall 2', 'capacity': 150}
        response = self.client.post(self.url_list, new_hall_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MovieHall.objects.count(), 2)

    def test_update_movie_hall(self):
        self.client.force_authenticate(user=self.staff_user)
        updated_data = {'name': 'Updated Hall', 'capacity': 120}
        response = self.client.put(self.url_detail, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.hall.refresh_from_db()
        self.assertEqual(self.hall.name, 'Updated Hall')

    def test_partial_update_movie_hall(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.patch(self.url_detail, {'capacity': 130}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.hall.refresh_from_db()
        self.assertEqual(self.hall.capacity, 130)

    def test_delete_movie_hall(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(MovieHall.objects.count(), 0)


class MovieAPITestCase(APITestCase):
    def setUp(self):
        # Clear existing data
        Movie.objects.all().delete()
        MovieHall.objects.all().delete()
        User.objects.all().delete()

        self.staff_user = User.objects.create_user(username='staff', password='pass1234')
        self.staff_user.is_staff = True
        self.staff_user.save()

        self.hall = MovieHall.objects.create(name='Hall 1', capacity=100)
        self.movie_data = {
            'title': 'Test Movie',
            'description': 'Test Description',
            'duration': 120,
            'genre': 'Action',
            'director': 'Test Director',
            'release_year': 2023,
            'rating': 8.5,
            'status': 'now_playing',
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
        # Check that our created movie is in the response
        movie_titles = [m['title'] for m in data]
        self.assertIn(self.movie_data['title'], movie_titles)

    def test_retrieve_movie(self):
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.movie_data['title'])

    def test_create_movie_disabled(self):
        # POST requires staff due to RBAC; creation itself is disabled by design
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post(self.url_list, self.movie_data, format='json')
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

    @patch('cinema.services.search_movies')
    def test_search_tmdb(self, mock_search):
        mock_search.return_value = {'results': [{'id': 123, 'title': 'TMDB Movie'}]}
        response = self.client.get(f'{self.url_list}search_tmdb/?query=test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('cinema.services.get_popular_movies')
    def test_popular_tmdb(self, mock_popular):
        mock_popular.return_value = {'results': [{'id': 123, 'title': 'Popular Movie'}]}
        response = self.client.get(f'{self.url_list}popular_tmdb/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('cinema.services.get_movie_details')
    def test_tmdb_details(self, mock_details):
        mock_details.return_value = {'title': 'TMDB Details'}
        response = self.client.get(f'{self.url_list}tmdb_details/?movie_id=123')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('cinema.services.search_movies')
    @patch('cinema.services.get_movie_details')
    def test_refresh_from_tmdb(self, mock_details, mock_search):
        self.client.force_authenticate(user=self.staff_user)
        mock_search.return_value = {'results': [{'id': 123}]}
        mock_details.return_value = {
            'videos': {'results': [{'type': 'Trailer', 'site': 'YouTube', 'key': 'abc123'}]},
            'images': {'backdrops': [{'file_path': '/backdrop.jpg'}]},
            'credits': {'cast': [{'name': 'Actor', 'character': 'Role', 'profile_path': '/profile.jpg'}]}
        }
        response = self.client.post(f'{self.url_detail}refresh_from_tmdb/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.movie.refresh_from_db()
        self.assertIsNotNone(self.movie.trailer_url)

    @patch('cinema.services.get_movie_details')
    def test_create_from_tmdb(self, mock_details):
        self.client.force_authenticate(user=self.staff_user)
        mock_details.return_value = {
            'title': 'New Movie', 'overview': 'Desc', 'runtime': 100, 'genres': [{'name': 'Action'}],
            'release_date': '2023-01-01', 'vote_average': 7.5, 'poster_path': '/poster.jpg',
            'credits': {'crew': [{'job': 'Director', 'name': 'Dir'}], 'cast': []},
            'videos': {'results': []}, 'images': {'backdrops': []}
        }
        response = self.client.post(f'{self.url_list}create_from_tmdb/', {'tmdb_id': 123}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    @patch('cinema.services.search_movies')
    @patch('cinema.services.get_movie_details')
    def test_create_from_search(self, mock_details, mock_search):
        self.client.force_authenticate(user=self.staff_user)
        mock_search.return_value = {'results': [{'id': 123}]}
        mock_details.return_value = {
            'title': 'New Movie', 'overview': 'Desc', 'runtime': 100, 'genres': [{'name': 'Action'}],
            'release_date': '2023-01-01', 'vote_average': 7.5, 'poster_path': '/poster.jpg',
            'credits': {'crew': [{'job': 'Director', 'name': 'Dir'}], 'cast': []},
            'videos': {'results': []}, 'images': {'backdrops': []}
        }
        response = self.client.post(f'{self.url_list}create_from_search/', {'query': 'test'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ScreeningAPITestCase(APITestCase):
    def setUp(self):
        # Clear existing data
        Screening.objects.all().delete()
        Movie.objects.all().delete()
        MovieHall.objects.all().delete()
        User.objects.all().delete()

        self.staff_user = User.objects.create_user(username='staff', password='pass1234')
        self.staff_user.is_staff = True
        self.staff_user.save()

        self.hall = MovieHall.objects.create(name='Hall 1', capacity=100)
        self.movie = Movie.objects.create(
            title='Test Movie', description='Desc', duration=120, genre='Action',
            director='Dir', release_year=2023, rating=8.0, status='now_playing'
        )
        self.start_time = timezone.now().replace(minute=0, second=0, microsecond=0)
        self.screening_data = {
            'movie': self.movie.pk,
            'hall': self.hall.pk,
            'start_time': self.start_time.isoformat(),
            'price': 10.00
        }
        self.screening = Screening.objects.create(
            movie=self.movie, hall=self.hall, start_time=self.start_time, price=10.00
        )
        self.url_list = reverse('screening-list')
        self.url_detail = reverse('screening-detail', kwargs={'pk': self.screening.pk})

    def test_list_screenings(self):
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_screening(self):
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_screening(self):
        self.client.force_authenticate(user=self.staff_user)
        from django.utils import timezone
        new_data = self.screening_data.copy()
        new_data['start_time'] = timezone.now()
        response = self.client.post(self.url_list, new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_screening(self):
        self.client.force_authenticate(user=self.staff_user)
        updated_data = self.screening_data.copy()
        updated_data['price'] = 12.00
        response = self.client.put(self.url_detail, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_partial_update_screening(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.patch(self.url_detail, {'price': 11.00}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_screening(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_bookings_action(self):
        response = self.client.get(f'{self.url_detail}bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class BookingAPITestCase(APITestCase):
    def setUp(self):
        # Clear existing data
        Booking.objects.all().delete()
        Screening.objects.all().delete()
        Movie.objects.all().delete()
        MovieHall.objects.all().delete()
        User.objects.all().delete()

        self.user = User.objects.create_user(username='user1', password='pass1234')

        self.hall = MovieHall.objects.create(name='Hall 1', capacity=100)
        self.movie = Movie.objects.create(
            title='Test Movie', description='Desc', duration=120, genre='Action',
            director='Dir', release_year=2023, rating=8.0, status='now_playing'
        )
        self.start_time = timezone.now().replace(minute=0, second=0, microsecond=0)
        self.screening = Screening.objects.create(
            movie=self.movie, hall=self.hall, start_time=self.start_time, price=10.00
        )
        self.booking_data = {
            'screening': self.screening.pk,
            'customer_name': 'John Doe',
            'customer_email': 'john@example.com',
            'customer_phone': '123456789',
            'seats_booked': 2
        }
        # Create booking with the instance, not pk
        self.booking = Booking.objects.create(
            screening=self.screening,
            user=self.user,
            customer_name='John Doe',
            customer_email='john@example.com',
            customer_phone='123456789',
            seats_booked=2
        )
        self.url_list = reverse('booking-list')
        self.url_detail = reverse('booking-detail', kwargs={'pk': self.booking.pk})

    def test_list_bookings(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_booking(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_booking(self):
        self.client.force_authenticate(user=self.user)
        new_data = self.booking_data.copy()
        new_data['customer_name'] = 'Jane Doe'
        new_data['customer_email'] = 'jane@example.com'
        response = self.client.post(self.url_list, new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_booking(self):
        self.client.force_authenticate(user=self.user)
        updated_data = self.booking_data.copy()
        updated_data['customer_name'] = 'Updated Name'
        response = self.client.put(self.url_detail, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_partial_update_booking(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.url_detail, {'customer_phone': '987654321'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_booking(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
