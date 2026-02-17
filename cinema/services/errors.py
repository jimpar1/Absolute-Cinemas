"""
ServiceError — shared exception type for the service layer.
Carries an HTTP-style status_code so views can forward it easily.
"""


class ServiceError(Exception):
    """Raised when a service-layer operation fails."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
