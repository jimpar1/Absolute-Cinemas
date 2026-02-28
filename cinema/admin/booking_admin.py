"""BookingAdmin — admin panel config for ticket bookings."""

from django.contrib import admin
from ..models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """Display bookings with user info, screening, seats, and status."""
    list_display = ['id', 'user_username', 'customer_name', 'screening', 'seats_booked', 'seat_numbers', 'total_price', 'status', 'booking_date']
    list_filter = ['status', 'booking_date']
    search_fields = ['user__username', 'customer_name', 'customer_email', 'screening__movie__title']
    ordering = ['-booking_date']
    readonly_fields = ['total_price', 'booking_date']

    def user_username(self, obj):
        """Show the linked user's username or 'Guest' for anonymous bookings."""
        return obj.user.username if obj.user else 'Guest'
    user_username.short_description = 'User'
