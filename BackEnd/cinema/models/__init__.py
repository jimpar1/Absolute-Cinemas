"""
cinema.models package — one model per file for clarity.

Imports all model classes at the package level so the rest
of the codebase can keep using ``from cinema.models import Movie``.
"""

from .customer import Customer          # noqa: F401
from .movie_hall import MovieHall, HallPhoto  # noqa: F401
from .movie import Movie                # noqa: F401
from .screening import Screening        # noqa: F401
from .booking import Booking            # noqa: F401
from .seat_lock import SeatLock         # noqa: F401
from .subscription import Subscription  # noqa: F401

__all__ = [
	'Customer',
	'MovieHall',
	'HallPhoto',
	'Movie',
	'Screening',
	'Booking',
	'SeatLock',
	'Subscription',
]
