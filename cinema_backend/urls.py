"""
Ρυθμίσεις URL για το cinema_backend project
URL configuration for cinema_backend project.

Ορίζει τα URL patterns για ολόκληρο το project.
Περιλαμβάνει:
- /admin/ - Django admin panel
- /api/ - Cinema API endpoints (movies, screenings, bookings)
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),  # Django admin interface
    path('api/', include('cinema.urls')),  # Cinema API endpoints
]

