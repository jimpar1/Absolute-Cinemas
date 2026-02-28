"""
MovieHallViewSet — CRUD API for cinema halls.
"""

from rest_framework import viewsets
from dependency_injector.wiring import Provide, inject

from ..container import Container
from ..permissions import IsStaffWithModelPermsOrReadOnly
from ..serializers import MovieHallSerializer
from ..services import MovieHallService


class MovieHallViewSet(viewsets.ModelViewSet):
    """
    Provides CRUD operations for cinema halls.
    Read access is public; write access requires staff.
    """
    serializer_class = MovieHallSerializer
    permission_classes = [IsStaffWithModelPermsOrReadOnly]

    @inject
    def get_queryset(self, service: MovieHallService = Provide[Container.movie_hall_service]):
        return service.list_halls()
