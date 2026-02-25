"""Tests for the Booking API endpoints (CRUD)."""

from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from cinema.models import Movie, Screening, Booking, MovieHall


class BookingAPITestCase(APITestCase):
    """Verify list, retrieve, create, update, partial_update, and delete for bookings."""

    def setUp(self):
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
            'customer_name': 'John Doe', 'customer_email': 'john@example.com',
            'customer_phone': '123456789', 'seats_booked': 2
        }
        self.booking = Booking.objects.create(
            screening=self.screening, user=self.user,
            customer_name='John Doe', customer_email='john@example.com',
            customer_phone='123456789', seats_booked=2
        )
        self.url_list = reverse('booking-list')
        self.url_detail = reverse('booking-detail', kwargs={'pk': self.booking.pk})

    def test_list_bookings(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertGreaterEqual(len(data), 1)

    def test_retrieve_booking(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['customer_name'], self.booking.customer_name)

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
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.customer_name, 'Updated Name')

    def test_partial_update_booking(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.url_detail, {'customer_phone': '987654321'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.customer_phone, '987654321')

    def test_delete_booking(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Booking.objects.count(), 0)
