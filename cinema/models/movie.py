"""
Movie model — stores information about each film: title, genre, director,
rating, poster/trailer URLs, scene shots (JSON), and cast (JSON).
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta


class Movie(models.Model):
    """
    Represents a single movie in the cinema catalogue.
    The ``status`` field is stored but also has a computed property
    (``computed_status``) that checks upcoming screenings.
    """
    title = models.CharField(max_length=200, verbose_name="Title")
    description = models.TextField(verbose_name="Description", blank=True)
    duration = models.IntegerField(
        verbose_name="Duration (min)",
        validators=[MinValueValidator(1)]
    )
    genre = models.CharField(max_length=100, verbose_name="Genre")
    director = models.CharField(max_length=200, verbose_name="Director")
    release_year = models.IntegerField(
        verbose_name="Release Year",
        validators=[MinValueValidator(1900), MaxValueValidator(2100)]
    )
    rating = models.DecimalField(
        max_digits=3, decimal_places=1,
        verbose_name="Rating",
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    status = models.CharField(
        max_length=20,
        choices=[('upcoming', 'Upcoming'), ('now_playing', 'Now Playing')],
        default='upcoming',
        verbose_name="Status"
    )
    poster_url = models.URLField(verbose_name="Poster URL", blank=True, null=True)
    trailer_url = models.URLField(verbose_name="Trailer URL", blank=True, null=True)
    shots = models.JSONField(verbose_name="Scene Shots", blank=True, null=True)
    actors = models.JSONField(verbose_name="Actors", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    @property
    def computed_status(self):
        """
        Determine status dynamically based on whether the movie has
        any screenings during the current week (Monday–Sunday).
        Returns 'now_playing' if yes, otherwise 'upcoming'.
        """
        now = timezone.now()
        week_start = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        week_end = week_start + timedelta(days=7)

        has_screening_this_week = self.screenings.filter(
            start_time__gte=week_start,
            start_time__lt=week_end
        ).exists()

        return 'now_playing' if has_screening_this_week else 'upcoming'

    class Meta:
        verbose_name = "Movie"
        verbose_name_plural = "Movies"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.release_year})"
