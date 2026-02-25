"""Tests for the MovieHall API endpoints (CRUD)."""

from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth.models import User
from cinema.models import MovieHall


class MovieHallAPITestCase(APITestCase):
    """Verify list, retrieve, create, update, partial_update, and delete for halls."""

    def setUp(self):
        MovieHall.objects.all().delete()
        User.objects.all().delete()

        # Use superuser to bypass permission checks for admin actions
        self.staff_user = User.objects.create_superuser(username='staff', password='pass1234', email='staff@example.com')

        self.hall_data = {'name': 'Hall 1', 'capacity': 100}
        self.hall = MovieHall.objects.create(**self.hall_data)
        self.url_list = reverse('moviehall-list')
        self.url_detail = reverse('moviehall-detail', kwargs={'pk': self.hall.pk})

    def test_list_movie_halls(self):
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertGreaterEqual(len(data), 1)
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
        """Patch the hall name — capacity is auto-computed and not directly writable."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.patch(self.url_detail, {'name': 'Renamed Hall'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.hall.refresh_from_db()
        self.assertEqual(self.hall.name, 'Renamed Hall')

    def test_delete_movie_hall(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(MovieHall.objects.count(), 0)
