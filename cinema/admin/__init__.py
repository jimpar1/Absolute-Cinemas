"""
cinema.admin package — Django admin configuration, split by model.
Imports all admin classes so Django discovers them.
"""

from .customer_admin import CustomerAdmin       # noqa: F401
from .movie_hall_admin import MovieHallAdmin     # noqa: F401
from .movie_admin import MovieAdmin              # noqa: F401
from .screening_admin import ScreeningAdmin      # noqa: F401
from .booking_admin import BookingAdmin          # noqa: F401
