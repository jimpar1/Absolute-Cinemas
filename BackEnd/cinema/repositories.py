"""
Repository layer — thin wrappers around Django ORM querysets.
Each repository is a frozen dataclass that exposes list / get / filter methods.
"""

from __future__ import annotations

from dataclasses import dataclass

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction

from .models import Booking, Customer, Movie, MovieHall, Screening, SeatLock, Subscription


@dataclass(frozen=True)
class MovieRepository:
    """Read access to Movie objects."""
    def list(self):
        return Movie.objects.all()

    def get(self, movie_id: int) -> Movie:
        return Movie.objects.get(pk=movie_id)


@dataclass(frozen=True)
class ScreeningRepository:
    """Read access to Screening objects."""
    def list(self):
        return Screening.objects.all()

    def get(self, screening_id: int) -> Screening:
        return Screening.objects.get(pk=screening_id)


@dataclass(frozen=True)
class BookingRepository:
    """Read access to Booking objects, with user/screening filters."""
    def list(self):
        return Booking.objects.all()

    def for_screening(self, screening: Screening):
        return screening.bookings.exclude(status='cancelled')

    def for_user(self, user):
        return Booking.objects.filter(user=user)


@dataclass(frozen=True)
class MovieHallRepository:
    """Read access to MovieHall objects."""
    def list(self):
        return MovieHall.objects.all()

    def get(self, hall_id: int) -> MovieHall:
        return MovieHall.objects.get(pk=hall_id)


@dataclass(frozen=True)
class SeatLockRepository:
    """Read access to SeatLock objects."""
    def list(self):
        return SeatLock.objects.all()

    def for_screening(self, screening: Screening):
        return SeatLock.objects.filter(screening=screening)


@dataclass(frozen=True)
class SubscriptionRepository:
    """Read/write access to Subscription objects."""

    def get_for_user(self, user):
        return Subscription.objects.select_related('customer').get(customer__user=user)

    def get_or_create_free(self, user):
        with transaction.atomic():
            try:
                profile = user.customer_profile
            except (ObjectDoesNotExist, AttributeError):
                profile, _ = Customer.objects.get_or_create(user=user)
            
            sub, _ = Subscription.objects.get_or_create(customer=profile)
            return sub
