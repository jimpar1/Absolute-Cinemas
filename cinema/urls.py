"""
Αρχείο urls.py για την εφαρμογή cinema
URLs file for cinema application

Ορίζει τα URL patterns για τα API endpoints.
Χρησιμοποιεί το Django REST Framework Router για αυτόματη δημιουργία URLs.

Τα endpoints που δημιουργούνται:
- /api/movies/ - Movies CRUD operations
- /api/screenings/ - Screenings CRUD operations  
- /api/bookings/ - Bookings CRUD operations
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MovieViewSet, ScreeningViewSet, BookingViewSet, MovieHallViewSet

# Δημιουργία router για αυτόματη δημιουργία URLs
# Create router for automatic URL generation
router = DefaultRouter()

# Καταχώρηση των ViewSets στο router
# Register ViewSets with the router
router.register(r'movies', MovieViewSet, basename='movie')
router.register(r'screenings', ScreeningViewSet, basename='screening')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'moviehalls', MovieHallViewSet, basename='moviehall')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]
