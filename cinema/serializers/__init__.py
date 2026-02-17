"""
cinema.serializers package — auth serializers and domain serializers split into separate files.
Re-exports everything at the package level for backwards compatibility.
"""

from .auth_serializers import (          # noqa: F401
    CustomerSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
)
from .domain_serializers import (        # noqa: F401
    MovieHallSerializer,
    MovieSerializer,
    ScreeningSerializer,
    BookingSerializer,
)
