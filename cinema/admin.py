"""
Αρχείο admin.py - Ρυθμίσεις Django Admin
Admin file - Django Admin configuration

Καταχωρεί τα models στο Django admin panel για εύκολη διαχείριση
από το web interface.
"""

from django.contrib import admin
from .models import Movie, Screening, Booking


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το Movie model στο admin panel
    """
    list_display = ['title', 'director', 'genre', 'release_year', 'rating', 'duration']
    list_filter = ['genre', 'release_year']
    search_fields = ['title', 'director', 'genre']
    ordering = ['-created_at']


@admin.register(Screening)
class ScreeningAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το Screening model στο admin panel
    """
    list_display = ['movie', 'screen_number', 'start_time', 'available_seats', 'total_seats', 'price']
    list_filter = ['screen_number', 'start_time']
    search_fields = ['movie__title']
    ordering = ['start_time']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το Booking model στο admin panel
    """
    list_display = ['id', 'customer_name', 'screening', 'seats_booked', 'total_price', 'status', 'booking_date']
    list_filter = ['status', 'booking_date']
    search_fields = ['customer_name', 'customer_email', 'screening__movie__title']
    ordering = ['-booking_date']

