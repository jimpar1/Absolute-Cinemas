"""Tests for the Screening API endpoints (CRUD + bookings action)."""

from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from cinema.models import Movie, Screening, MovieHall


class ScreeningAPITestCase(APITestCase):
    """Verify list, retrieve, create, update, partial_update, delete, and bookings."""

    def setUp(self):
        Screening.objects.all().delete()
        Movie.objects.all().delete()
        MovieHall.objects.all().delete()
        User.objects.all().delete()

        # Use superuser to bypass permission checks for admin actions
        self.staff_user = User.objects.create_superuser(username='staff', password='pass1234', email='staff@example.com')

        self.hall = MovieHall.objects.create(name='Hall 1', capacity=100)
        self.movie = Movie.objects.create(
            title='Test Movie', description='Desc', duration=120, genre='Action',
            director='Dir', release_year=2023, rating=8.0, status='now_playing'
        )
        self.start_time = timezone.now().replace(minute=0, second=0, microsecond=0)
        self.screening_data = {
            'movie': self.movie.pk, 'hall': self.hall.pk,
            'start_time': self.start_time.isoformat(), 'price': 10.00
        }
        self.screening = Screening.objects.create(
            movie=self.movie, hall=self.hall, start_time=self.start_time, price=10.00
        )
        self.url_list = reverse('screening-list')
        self.url_detail = reverse('screening-detail', kwargs={'pk': self.screening.pk})

    def test_list_screenings(self):
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertGreaterEqual(len(data), 1)

    def test_retrieve_screening(self):
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Convert Decimal to float for comparison
        self.assertEqual(float(response.data['price']), 10.00)

    def test_create_screening(self):
        self.client.force_authenticate(user=self.staff_user)
        new_data = self.screening_data.copy()
        new_data['start_time'] = timezone.now().isoformat()
        response = self.client.post(self.url_list, new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_screening(self):
        self.client.force_authenticate(user=self.staff_user)
        updated_data = self.screening_data.copy()
        updated_data['price'] = 12.00
        response = self.client.put(self.url_detail, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.screening.refresh_from_db()
        self.assertEqual(float(self.screening.price), 12.00)

    def test_partial_update_screening(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.patch(self.url_detail, {'price': 11.00}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.screening.refresh_from_db()
        self.assertEqual(float(self.screening.price), 11.00)

    def test_delete_screening(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Screening.objects.count(), 0)

    def test_bookings_action(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(f'{self.url_detail}bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
