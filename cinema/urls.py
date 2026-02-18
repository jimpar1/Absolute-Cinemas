"""
Αρχείο urls.py για την εφαρμογή cinema
URLs file for cinema application

Ορίζει τα URL patterns για τα API endpoints.
Χρησιμοποιεί το Django REST Framework Router για αυτόματη δημιουργία URLs.

Τα endpoints που δημιουργούνται:
- /api/movies/ - Movies CRUD operations
- /api/screenings/ - Screenings CRUD operations  
- /api/bookings/ - Bookings CRUD operations
- /api/auth/ - Authentication endpoints (register, login, profile)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import MovieViewSet, ScreeningViewSet, BookingViewSet, MovieHallViewSet
from .auth_views import RegisterView, LoginView, LogoutView, ProfileView, MyBookingsView

# Δημιουργία router για αυτόματη δημιουργία URLs
# Create router for automatic URL generation
router = DefaultRouter()

# Καταχώρηση των ViewSets στο router
# Register ViewSets with the router
router.register(r'movies', MovieViewSet, basename='movie')
router.register(r'screenings', ScreeningViewSet, basename='screening')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'moviehalls', MovieHallViewSet, basename='moviehall')

# Authentication URLs
auth_patterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('my-bookings/', MyBookingsView.as_view(), name='auth-my-bookings'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include(auth_patterns)),
]
