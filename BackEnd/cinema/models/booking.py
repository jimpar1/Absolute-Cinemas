"""
Booking model — a confirmed ticket purchase for a specific screening.
Tracks customer info, seat numbers, price, and booking status.
On creation it auto-calculates the total price and decrements available seats.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

from .screening import Screening


class Booking(models.Model):
    """A ticket reservation / purchase for a Screening."""

    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('pending', 'Pending'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        related_name='bookings', verbose_name="User",
        null=True, blank=True,
        help_text="Authenticated user who made the booking (optional for guests)"
    )
    screening = models.ForeignKey(
        Screening, on_delete=models.CASCADE,
        related_name='bookings', verbose_name="Screening"
    )
    customer_name = models.CharField(max_length=200, verbose_name="Customer Name")
    customer_email = models.EmailField(verbose_name="Customer Email")
    customer_phone = models.CharField(max_length=20, verbose_name="Customer Phone", blank=True)
    seats_booked = models.IntegerField(verbose_name="Number of Seats", validators=[MinValueValidator(1)])
    seat_numbers = models.CharField(
        max_length=500, verbose_name="Seat Numbers", blank=True,
        help_text="Comma-separated seat identifiers, e.g. A1, A2, B5"
    )
    total_price = models.DecimalField(
        max_digits=8, decimal_places=2,
        verbose_name="Total Price",
        validators=[MinValueValidator(0)]
    )
    booking_date = models.DateTimeField(auto_now_add=True, verbose_name="Booking Date")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES,
        default='pending', verbose_name="Status"
    )
    stripe_payment_intent_id = models.CharField(
        max_length=255, verbose_name="Stripe Payment Intent ID",
        null=True, blank=True,
        help_text="Stripe PaymentIntent ID for this booking"
    )
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES,
        default='pending_payment', verbose_name="Payment Status"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        ordering = ['-booking_date']

    def __str__(self):
        return f"Booking #{self.id} - {self.customer_name} - {self.screening}"

    def save(self, *args, **kwargs):
        """
        On creation:
        1. Calculate total_price = ticket price × seats.
        2. Check seat availability, then decrement available_seats.
        """
        if not self.pk:
            self.total_price = self.screening.price * self.seats_booked
            if self.seats_booked > self.screening.available_seats:
                raise ValueError("Not enough available seats")
            self.screening.available_seats -= self.seats_booked
            self.screening.save()

        super().save(*args, **kwargs)
