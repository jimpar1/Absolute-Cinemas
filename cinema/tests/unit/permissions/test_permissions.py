"""Tests for custom permissions."""

import pytest
from unittest.mock import Mock
from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory

from cinema.permissions import IsStaffWithModelPermsOrReadOnly, IsStaffWithBookingViewPermission
from cinema.models import Movie


@pytest.mark.django_db
class TestIsStaffWithModelPermsOrReadOnly:
    """Test IsStaffWithModelPermsOrReadOnly permission class."""

    @pytest.fixture
    def permission(self):
        return IsStaffWithModelPermsOrReadOnly()

    @pytest.fixture
    def factory(self):
        return APIRequestFactory()

    def test_safe_methods_allowed(self, permission, factory):
        """Test that GET requests are always allowed."""
        request = factory.get('/api/movies/')
        request.user = User.objects.create_user(username='anonymous', password='pass')

        view = Mock()
        view.queryset = Movie.objects.all()

        assert permission.has_permission(request, view) is True

    def test_post_without_auth_denied(self, permission, factory):
        """Test that POST without auth is denied."""
        request = factory.post('/api/movies/')
        request.user = None

        view = Mock()
        view.queryset = Movie.objects.all()

        assert permission.has_permission(request, view) is False

    def test_post_non_staff_denied(self, permission, factory):
        """Test that POST from non-staff is denied."""
        request = factory.post('/api/movies/')
        request.user = User.objects.create_user(username='user', password='pass')

        view = Mock()
        view.queryset = Movie.objects.all()

        assert permission.has_permission(request, view) is False

    def test_post_staff_without_perm_denied(self, permission, factory):
        """Test that POST from staff without model permission is denied."""
        request = factory.post('/api/movies/')
        user = User.objects.create_user(username='staff', password='pass')
        user.is_staff = True
        user.save()
        request.user = user

        view = Mock()
        view.queryset = Movie.objects.all()
        view.action = 'create'

        # No add_movie permission
        assert permission.has_permission(request, view) is False

    def test_post_detail_action_requires_change(self, permission, factory, staff_user):
        """Test that POST to detail view (custom action) requires change permission."""
        request = factory.post('/api/movies/1/refresh/')
        request.user = staff_user

        view = Mock()
        view.queryset = Movie.objects.all()
        view.action = 'refresh_from_tmdb'
        view.kwargs = {'pk': 1}

        # Staff has all permissions, should pass
        assert permission.has_permission(request, view) is True



@pytest.mark.django_db
class TestIsStaffWithBookingViewPermission:
    """Test IsStaffWithBookingViewPermission permission class."""

    @pytest.fixture
    def permission(self):
        return IsStaffWithBookingViewPermission()

    @pytest.fixture
    def factory(self):
        return APIRequestFactory()

    def test_non_authenticated_denied(self, permission, factory):
        """Test that non-authenticated users are denied."""
        request = factory.get('/api/screenings/1/bookings/')
        request.user = None

        view = Mock()

        assert permission.has_permission(request, view) is False

    def test_non_staff_denied(self, permission, factory):
        """Test that non-staff users are denied."""
        request = factory.get('/api/screenings/1/bookings/')
        request.user = User.objects.create_user(username='user', password='pass')

        view = Mock()

        assert permission.has_permission(request, view) is False

    def test_staff_without_view_booking_perm_denied(self, permission, factory):
        """Test that staff without view_booking permission are denied."""
        request = factory.get('/api/screenings/1/bookings/')
        user = User.objects.create_user(username='staff', password='pass')
        user.is_staff = True
        user.save()
        request.user = user

        view = Mock()

        # No view_booking permission
        assert permission.has_permission(request, view) is False

    def test_staff_with_view_booking_perm_allowed(self, permission, factory, staff_user):
        """Test that staff with view_booking permission are allowed."""
        request = factory.get('/api/screenings/1/bookings/')
        request.user = staff_user  # Has all permissions

        view = Mock()

        assert permission.has_permission(request, view) is True

