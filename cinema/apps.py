"""
CinemaConfig — Django application configuration for the cinema app.
Wires the dependency-injection container on startup.
"""

from django.apps import AppConfig


class CinemaConfig(AppConfig):
    """Cinema app configuration — wires DI container in ready()."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cinema'
    verbose_name = 'Cinema Management'

    def ready(self):
        """Wire the DI container to all modules that use @inject."""
        from .container import container
        from .views import movie_views, screening_views, booking_views, movie_hall_views
        from . import auth_views

        container.wire(modules=[
            movie_views,
            screening_views,
            booking_views,
            movie_hall_views,
            auth_views,
        ])
