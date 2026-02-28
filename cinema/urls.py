"""
cinema.urls — URL configuration for the cinema REST API.

Uses DRF's DefaultRouter for automatic endpoint generation:
  - /api/movies/      → MovieViewSet
  - /api/screenings/  → ScreeningViewSet
  - /api/bookings/    → BookingViewSet
  - /api/moviehalls/  → MovieHallViewSet
  - /api/auth/        → Authentication endpoints (register, login, logout, profile, bookings)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import MovieViewSet, ScreeningViewSet, BookingViewSet, MovieHallViewSet
from .auth_views import RegisterView, LoginView, LogoutView, ProfileView, MyBookingsView, ChangePasswordView

# Router auto-generates list / detail / custom-action URLs
router = DefaultRouter()
router.register(r'movies', MovieViewSet, basename='movie')
router.register(r'screenings', ScreeningViewSet, basename='screening')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'moviehalls', MovieHallViewSet, basename='moviehall')

# Auth endpoints (non-router)
auth_patterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('my-bookings/', MyBookingsView.as_view(), name='auth-my-bookings'),
  path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include(auth_patterns)),
]
