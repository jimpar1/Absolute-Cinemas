"""
cinema.serializers package — auth serializers and domain serializers split into separate files.
Re-exports everything at the package level for backwards compatibility.
"""

from .auth_serializers import (          # noqa: F401
    CustomerSerializer,
    ChangePasswordSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
)
from .domain_serializers import (        # noqa: F401
    MovieHallSerializer,
    MovieSerializer,
    ScreeningSerializer,
    BookingSerializer,
)

__all__ = [
    'CustomerSerializer',
    'ChangePasswordSerializer',
    'UserRegistrationSerializer',
    'UserProfileSerializer',
    'MovieHallSerializer',
    'MovieSerializer',
    'ScreeningSerializer',
    'BookingSerializer',
]
