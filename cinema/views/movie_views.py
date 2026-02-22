"""
MovieViewSet — CRUD for movies plus TMDB integration endpoints.

Custom actions:
  - screenings         GET  /api/movies/{id}/screenings/
  - search_tmdb        GET  /api/movies/search_tmdb/?query=...
  - popular_tmdb       GET  /api/movies/popular_tmdb/
  - tmdb_details       GET  /api/movies/tmdb_details/?movie_id=...
  - refresh_from_tmdb  POST /api/movies/{id}/refresh_from_tmdb/
  - create_from_tmdb   POST /api/movies/create_from_tmdb/
  - create_from_search POST /api/movies/create_from_search/
"""

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from dependency_injector.wiring import Provide, inject

from ..container import Container
from ..permissions import IsStaffWithModelPermsOrReadOnly
from ..serializers import MovieSerializer, ScreeningSerializer
from ..services import MovieService, ScreeningService, ServiceError


class MovieViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for movies.
    Manual creation is disabled — movies are always imported from TMDB.
    """
    serializer_class = MovieSerializer
    permission_classes = [IsStaffWithModelPermsOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'director', 'genre']
    ordering_fields = ['title', 'release_year', 'rating', 'created_at']
    ordering = ['-created_at']

    @inject
    def get_queryset(self, service: MovieService = Provide[Container.movie_service]):
        return service.list_movies()

    # ── Detail actions ──

    @action(detail=True, methods=['get'])
    @inject
    def screenings(self, request, pk=None, screening_service: ScreeningService = Provide[Container.screening_service]):
        """GET /api/movies/{id}/screenings/ — list all screenings for a movie."""
        movie = self.get_object()
        screenings = movie.screenings.all()
        serializer = ScreeningSerializer(screenings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    @inject
    def refresh_from_tmdb(self, request, pk=None, service: MovieService = Provide[Container.movie_service]):
        """POST /api/movies/{id}/refresh_from_tmdb/ — refresh trailer, shots, actors."""
        movie = self.get_object()
        try:
            refresh_payload = service.refresh_movie_from_tmdb(movie.title)
        except ServiceError as exc:
            return Response({'error': exc.message}, status=exc.status_code)

        movie.trailer_url = refresh_payload['trailer_url']
        movie.shots = refresh_payload['shots']
        movie.actors = refresh_payload['actors']
        movie.save()

        serializer = self.get_serializer(movie)
        return Response(serializer.data)

    # ── Collection actions (no pk) ──

    @action(detail=False, methods=['get'])
    @inject
    def search_tmdb(self, request, service: MovieService = Provide[Container.movie_service]):
        """GET /api/movies/search_tmdb/?query=...&page=... — proxy to TMDB search."""
        query = request.query_params.get('query', '')
        page = int(request.query_params.get('page', 1))
        try:
            results = service.search_tmdb(query, page)
        except ServiceError as exc:
            return Response({'error': exc.message}, status=exc.status_code)
        if isinstance(results, dict):
            return Response(results)
        elif hasattr(results, '__dict__'):
            return Response(results.__dict__)
        return Response({'page': page, 'results': list(results) if results else []})

    @action(detail=False, methods=['get'])
    @inject
    def popular_tmdb(self, request, service: MovieService = Provide[Container.movie_service]):
        """GET /api/movies/popular_tmdb/ — proxy to TMDB popular endpoint."""
        page = int(request.query_params.get('page', 1))
        results = service.popular_tmdb(page)
        if isinstance(results, dict):
            return Response(results)
        elif hasattr(results, '__dict__'):
            return Response(results.__dict__)
        return Response({'page': page, 'results': list(results) if results else []})

    @action(detail=False, methods=['get'])
    @inject
    def tmdb_details(self, request, service: MovieService = Provide[Container.movie_service]):
        """GET /api/movies/tmdb_details/?movie_id=... — proxy to TMDB details."""
        movie_id = request.query_params.get('movie_id', '')
        if not movie_id:
            return Response({'error': 'movie_id parameter is required'}, status=400)
        try:
            details = service.tmdb_details(int(movie_id))
        except ServiceError as exc:
            return Response({'error': exc.message}, status=exc.status_code)
        if isinstance(details, dict):
            return Response(details)
        if hasattr(details, '__dict__'):
            return Response(details.__dict__)
        return Response({'error': 'Invalid response format'}, status=500)

    @action(detail=False, methods=['post'])
    @inject
    def create_from_tmdb(self, request, service: MovieService = Provide[Container.movie_service]):
        """POST /api/movies/create_from_tmdb/ — create movie by TMDB ID."""
        tmdb_id = request.data.get('tmdb_id')
        if not tmdb_id:
            return Response({'error': 'tmdb_id is required'}, status=400)
        try:
            tmdb_id = int(tmdb_id)
        except ValueError:
            return Response({'error': 'tmdb_id must be a valid integer'}, status=400)
        try:
            movie_data = service.build_movie_data_from_tmdb_id(tmdb_id)
        except ServiceError as exc:
            return Response({'error': exc.message}, status=exc.status_code)
        serializer = self.get_serializer(data=movie_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['post'])
    @inject
    def create_from_search(self, request, service: MovieService = Provide[Container.movie_service]):
        """POST /api/movies/create_from_search/ — search TMDB, take first hit, and create."""
        query = request.data.get('query')
        if not query:
            return Response({'error': 'query is required'}, status=400)
        try:
            search_results = service.search_tmdb(query, page=1)
        except ServiceError as exc:
            return Response({'error': exc.message}, status=exc.status_code)
        if not search_results or 'results' not in search_results or not search_results['results']:
            return Response({'error': 'No movies found for the given query'}, status=404)
        first_movie = search_results['results'][0]
        tmdb_id = first_movie['id']
        try:
            movie_data = service.build_movie_data_from_tmdb_id(int(tmdb_id))
        except ServiceError as exc:
            return Response({'error': exc.message}, status=exc.status_code)
        serializer = self.get_serializer(data=movie_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def create(self, request, *args, **kwargs):
        """Disable manual movie creation — use TMDB endpoints instead."""
        return Response(
            {'error': 'Manual movie creation is disabled. Use /api/movies/create_from_tmdb/ or /api/movies/create_from_search/.'},
            status=405
        )
