"""
SeatLock model — temporary seat reservation during the booking flow.
A lock expires after 10 minutes. Each (screening, seat_number) pair is unique.
"""

from django.db import models
from django.utils import timezone
from datetime import timedelta

from .screening import Screening


class SeatLock(models.Model):
    """
    Temporarily locks a seat so that no other browser session
    can select it while a user is in the booking flow.
    Expires after 10 minutes.
    """
    screening = models.ForeignKey(
        Screening, on_delete=models.CASCADE,
        related_name='seat_locks', verbose_name="Screening"
    )
    seat_number = models.CharField(max_length=10, verbose_name="Seat Number")
    session_id = models.CharField(max_length=100, verbose_name="Session ID")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Created At")

    class Meta:
        verbose_name = "Seat Lock"
        verbose_name_plural = "Seat Locks"
        unique_together = ['screening', 'seat_number']

    @property
    def is_expired(self):
        """True if the lock is older than 10 minutes."""
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"Lock: {self.seat_number} for {self.screening.movie.title} (Session: {self.session_id})"
