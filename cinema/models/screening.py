"""
Screening model — a specific showing of a movie in a hall at a given time.
Handles overlap validation (no two screenings in the same hall at the same time)
and auto-sets available_seats from the hall capacity on creation.
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from datetime import timedelta

from .movie import Movie
from .movie_hall import MovieHall


class Screening(models.Model):
    """A scheduled showing of a Movie in a MovieHall."""

    movie = models.ForeignKey(
        Movie, on_delete=models.CASCADE,
        related_name='screenings', verbose_name="Movie"
    )
    hall = models.ForeignKey(
        MovieHall, on_delete=models.CASCADE,
        related_name='screenings', verbose_name="Hall"
    )
    start_time = models.DateTimeField(verbose_name="Start Time")
    price = models.DecimalField(
        max_digits=6, decimal_places=2,
        verbose_name="Ticket Price",
        validators=[MinValueValidator(0)], default=0
    )
    available_seats = models.IntegerField(
        verbose_name="Available Seats",
        validators=[MinValueValidator(0)]
    )

    @property
    def end_time(self):
        """Computed end time: start + movie duration."""
        if self.start_time is None:
            return None
        return self.start_time + timedelta(minutes=self.movie.duration)

    @property
    def total_seats(self):
        """Total seat count comes from the hall."""
        return self.hall.capacity

    def clean(self):
        """
        Validate the screening:
        1. Start time must exist.
        2. Must start on the hour or half-hour.
        3. Must not overlap with another screening in the same hall.
        """
        if not self.start_time:
            raise ValidationError({"start_time": "Start time is required."})
        if not self.end_time:
            raise ValidationError({"end_time": "End time is required."})
        if self.start_time.minute not in [0, 30]:
            raise ValidationError({"start_time": "Start time must be on the hour or half-hour."})
        if self.end_time <= self.start_time:
            raise ValidationError({"end_time": "End time must be after start time."})

        # Check for overlapping screenings in the same hall
        end_time = self.end_time
        overlapping = Screening.objects.filter(
            hall=self.hall,
            start_time__lt=end_time,
        ).exclude(pk=self.pk)

        for screening in overlapping:
            if screening.end_time > self.start_time:
                raise ValidationError(
                    f"There is already a screening in hall {self.hall.name} "
                    f"that overlaps with this time."
                )

    def save(self, *args, **kwargs):
        """Auto-set available_seats from the hall capacity on first save."""
        if self.pk is None:
            self.available_seats = self.hall.capacity
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Screening"
        verbose_name_plural = "Screenings"
        ordering = ['start_time']

    def __str__(self):
        return f"{self.movie.title} at {self.hall.name} on {self.start_time.strftime('%Y-%m-%d %H:%M')}"
