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
from .views.subscription_views import SubscriptionView
from .views.payment_views import (
    StripeConfigView, CreateBookingIntentView,
    CreateSubscriptionCheckoutView, StripeWebhookView, RefundView,
    ConfirmSubscriptionView, ConfirmBookingView,
)

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

# Payment endpoints (Stripe integration)
payment_patterns = [
    path('config/', StripeConfigView.as_view(), name='payments-config'),
    path('create-booking-intent/', CreateBookingIntentView.as_view(), name='payments-booking-intent'),
    path('create-subscription-checkout/', CreateSubscriptionCheckoutView.as_view(), name='payments-subscription-checkout'),
    path('webhook/', StripeWebhookView.as_view(), name='payments-webhook'),
    path('confirm-subscription/', ConfirmSubscriptionView.as_view(), name='payments-confirm-subscription'),
    path('confirm-booking/', ConfirmBookingView.as_view(), name='payments-confirm-booking'),
    path('refund/', RefundView.as_view(), name='payments-refund'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include(auth_patterns)),
    path('me/subscription/', SubscriptionView.as_view(), name='me-subscription'),
    path('payments/', include(payment_patterns)),
]
