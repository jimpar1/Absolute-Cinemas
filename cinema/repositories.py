from __future__ import annotations

from dataclasses import dataclass

from .models import Booking, Movie, MovieHall, Screening


@dataclass(frozen=True)
class MovieRepository:
    def list(self):
        return Movie.objects.all()

    def get(self, movie_id: int) -> Movie:
        return Movie.objects.get(pk=movie_id)


@dataclass(frozen=True)
class ScreeningRepository:
    def list(self):
        return Screening.objects.all()

    def get(self, screening_id: int) -> Screening:
        return Screening.objects.get(pk=screening_id)


@dataclass(frozen=True)
class BookingRepository:
    def list(self):
        return Booking.objects.all()

    def for_screening(self, screening: Screening):
        return screening.bookings.all()

    def for_user(self, user):
        return Booking.objects.filter(user=user)


@dataclass(frozen=True)
class MovieHallRepository:
    def list(self):
        return MovieHall.objects.all()

    def get(self, hall_id: int) -> MovieHall:
        return MovieHall.objects.get(pk=hall_id)
