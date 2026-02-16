"""
Αρχείο views.py - Ορισμός των views για το REST API
Views file - Definition of views for REST API

Περιέχει ViewSets για CRUD operations (Create, Read, Update, Delete) στα models:
- Movie (Ταινία)
- Screening (Προβολή)
- Booking (Κράτηση)

Τα ViewSets παρέχουν αυτόματα όλες τις βασικές λειτουργίες API:
- list: Λίστα όλων των αντικειμένων (GET /api/movies/)
- retrieve: Λεπτομέρειες ενός αντικειμένου (GET /api/movies/1/)
- create: Δημιουργία νέου αντικειμένου (POST /api/movies/)
- update: Ενημέρωση αντικειμένου (PUT /api/movies/1/)
- partial_update: Μερική ενημέρωση (PATCH /api/movies/1/)
- destroy: Διαγραφή αντικειμένου (DELETE /api/movies/1/)
"""

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny

from dependency_injector.wiring import Provide, inject

from .container import Container
from .permissions import IsStaffOrReadOnly
from .serializers import MovieSerializer, ScreeningSerializer, BookingSerializer, MovieHallSerializer
from .services import MovieService, ScreeningService, BookingService, MovieHallService, SeatLockService, ServiceError


class MovieHallViewSet(viewsets.ModelViewSet):
    """
    ViewSet for the MovieHall model
    Provides CRUD operations for movie halls
    """
    serializer_class = MovieHallSerializer
    permission_classes = [IsStaffOrReadOnly]

    @inject
    def get_queryset(self, service: MovieHallService = Provide[Container.movie_hall_service]):
        return service.list_halls()


class MovieViewSet(viewsets.ModelViewSet):
    """
    ViewSet για το Movie model
    Παρέχει CRUD operations για τις ταινίες
    
    Endpoints:
    - GET /api/movies/ - Λίστα όλων των ταινιών
    - GET /api/movies/{id}/ - Λεπτομέρειες μιας ταινίας
    - POST /api/movies/ - Δημιουργία νέας ταινίας
    - PUT /api/movies/{id}/ - Ενημέρωση ταινίας
    - PATCH /api/movies/{id}/ - Μερική ενημέρωση ταινίας
    - DELETE /api/movies/{id}/ - Διαγραφή ταινίας
    """
    serializer_class = MovieSerializer
    permission_classes = [IsStaffOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'director', 'genre']  # Αναζήτηση με βάση τον τίτλο, σκηνοθέτη, είδος
    ordering_fields = ['title', 'release_year', 'rating', 'created_at']  # Πεδία ταξινόμησης
    ordering = ['-created_at']  # Προεπιλεγμένη ταξινόμηση

    @inject
    def get_queryset(self, service: MovieService = Provide[Container.movie_service]):
        return service.list_movies()

    @action(detail=True, methods=['get'])
    @inject
    def screenings(self, request, pk=None, screening_service: ScreeningService = Provide[Container.screening_service]):
        """
        Custom action για να πάρουμε όλες τις προβολές μιας ταινίας
        GET /api/movies/{id}/screenings/
        """
        movie = self.get_object()
        screenings = movie.screenings.all()
        serializer = ScreeningSerializer(screenings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    @inject
    def search_tmdb(self, request, service: MovieService = Provide[Container.movie_service]):
        """
        Custom action για αναζήτηση ταινιών στο TMDB
        GET /api/movies/search_tmdb/?query=<query>&page=<page>
        """
        query = request.query_params.get('query', '')
        page = int(request.query_params.get('page', 1))
        try:
            results = service.search_tmdb(query, page)
        except ServiceError as exc:
            return Response({'error': exc.message}, status=exc.status_code)
        # Convert results to a serializable format
        if isinstance(results, dict):
            return Response(results)
        elif hasattr(results, '__dict__'):
            return Response(results.__dict__)
        else:
            return Response({'page': page, 'results': list(results) if results else []})

    @action(detail=False, methods=['get'])
    @inject
    def popular_tmdb(self, request, service: MovieService = Provide[Container.movie_service]):
        """
        Custom action για δημοφιλείς ταινίες από TMDB
        GET /api/movies/popular_tmdb/?page=<page>
        """
        page = int(request.query_params.get('page', 1))
        results = service.popular_tmdb(page)
        # Convert results to a serializable format
        if isinstance(results, dict):
            return Response(results)
        elif hasattr(results, '__dict__'):
            return Response(results.__dict__)
        else:
            return Response({'page': page, 'results': list(results) if results else []})

    @action(detail=False, methods=['get'])
    @inject
    def tmdb_details(self, request, service: MovieService = Provide[Container.movie_service]):
        """
        Custom action για λεπτομέρειες ταινίας από TMDB
        GET /api/movies/tmdb_details/?movie_id=<id>
        """
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

    @action(detail=True, methods=['post'])
    @inject
    def refresh_from_tmdb(self, request, pk=None, service: MovieService = Provide[Container.movie_service]):
        """
        Custom action για ανανέωση δεδομένων ταινίας από TMDB
        POST /api/movies/{id}/refresh_from_tmdb/
        """
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

    @action(detail=False, methods=['post'])
    @inject
    def create_from_tmdb(self, request, service: MovieService = Provide[Container.movie_service]):
        """
        Custom action για δημιουργία ταινίας από TMDB
        POST /api/movies/create_from_tmdb/
        Body: {"tmdb_id": 12345}
        """
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

        # Create the movie
        serializer = self.get_serializer(data=movie_data)
        if serializer.is_valid():
            movie = serializer.save()
            return Response(serializer.data, status=201)
        else:
            return Response(serializer.errors, status=400)

    @action(detail=False, methods=['post'])
    @inject
    def create_from_search(self, request, service: MovieService = Provide[Container.movie_service]):
        """
        Custom action για δημιουργία ταινίας από αναζήτηση στο TMDB
        POST /api/movies/create_from_search/
        Body: {"query": "Inception"}
        """
        query = request.data.get('query')
        if not query:
            return Response({'error': 'query is required'}, status=400)

        # Search TMDB for the query
        try:
            search_results = service.search_tmdb(query, page=1)
        except ServiceError as exc:
            return Response({'error': exc.message}, status=exc.status_code)
        if not search_results or 'results' not in search_results or not search_results['results']:
            return Response({'error': 'No movies found for the given query'}, status=404)

        # Take the first result
        first_movie = search_results['results'][0]
        tmdb_id = first_movie['id']

        try:
            movie_data = service.build_movie_data_from_tmdb_id(int(tmdb_id))
        except ServiceError as exc:
            return Response({'error': exc.message}, status=exc.status_code)

        serializer = self.get_serializer(data=movie_data)
        if serializer.is_valid():
            movie = serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def create(self, request, *args, **kwargs):
        """
        Override create to disable manual movie creation.
        Movies can only be added via TMDB endpoints.
        """
        return Response(
            {'error': 'Manual movie creation is disabled. Use /api/movies/create_from_tmdb/ or /api/movies/create_from_search/ to add movies from TMDB.'},
            status=405
        )


class ScreeningViewSet(viewsets.ModelViewSet):
    """
    ViewSet για το Screening model
    Παρέχει CRUD operations για τις προβολές
    
    Endpoints:
    - GET /api/screenings/ - Λίστα όλων των προβολών
    - GET /api/screenings/{id}/ - Λεπτομέρειες μιας προβολής
    - POST /api/screenings/ - Δημιουργία νέας προβολής
    - PUT /api/screenings/{id}/ - Ενημέρωση προβολής
    - PATCH /api/screenings/{id}/ - Μερική ενημέρωση προβολής
    - DELETE /api/screenings/{id}/ - Διαγραφή προβολής
    """
    serializer_class = ScreeningSerializer
    permission_classes = [IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['movie', 'hall']  # Φιλτράρισμα με βάση ταινία και αίθουσα
    ordering_fields = ['start_time', 'available_seats']  # Πεδία ταξινόμησης
    ordering = ['start_time']  # Προεπιλεγμένη ταξινόμηση

    @inject
    def get_queryset(self, service: ScreeningService = Provide[Container.screening_service]):
        return service.list_screenings()

    @action(detail=True, methods=['get'])
    @inject
    def bookings(self, request, pk=None, service: ScreeningService = Provide[Container.screening_service]):
        """
        Custom action για να πάρουμε όλες τις κρατήσεις μιας προβολής
        GET /api/screenings/{id}/bookings/
        """
        bookings = service.bookings_for_screening(int(pk))
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    @inject
    def lock_seats(self, request, pk=None, seat_lock_service: SeatLockService = Provide[Container.seat_lock_service]):
        screening = self.get_object()
        seat_numbers = request.data.get('seat_numbers', [])
        session_id = request.data.get('session_id')
        
        if not session_id or not seat_numbers:
            return Response({'error': 'session_id and seat_numbers are required'}, status=400)
            
        locked_seats = []
        try:
            for seat in seat_numbers:
                lock = seat_lock_service.lock_seat(screening, seat, session_id)
                locked_seats.append(seat)
        except ServiceError as e:
            return Response({'error': str(e)}, status=e.status_code)
            
        return Response({'locked_seats': locked_seats, 'session_id': session_id})

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    @inject
    def unlock_seats(self, request, pk=None, seat_lock_service: SeatLockService = Provide[Container.seat_lock_service]):
        screening = self.get_object()
        seat_numbers = request.data.get('seat_numbers', [])
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response({'error': 'session_id is required'}, status=400)
            
        if seat_numbers:
            for seat in seat_numbers:
                seat_lock_service.unlock_seat(screening, seat, session_id)
        else:
            locks = seat_lock_service.repo.list().filter(screening=screening, session_id=session_id)
            locks.delete()
            
        return Response({'status': 'success'})

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    @inject
    def locked_seats(self, request, pk=None, seat_lock_service: SeatLockService = Provide[Container.seat_lock_service]):
        screening = self.get_object()
        active_locks = seat_lock_service.get_locked_seats(screening)
        locks_dict = {lock.seat_number: lock.session_id for lock in active_locks}
        return Response(locks_dict)



class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet για το Booking model
    Παρέχει CRUD operations για τις κρατήσεις
    
    Endpoints:
    - GET /api/bookings/ - Λίστα όλων των κρατήσεων
    - GET /api/bookings/{id}/ - Λεπτομέρειες μιας κράτησης
    - POST /api/bookings/ - Δημιουργία νέας κράτησης
    - PUT /api/bookings/{id}/ - Ενημέρωση κράτησης
    - PATCH /api/bookings/{id}/ - Μερική ενημέρωση κράτησης
    - DELETE /api/bookings/{id}/ - Διαγραφή κράτησης
    """
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['screening', 'status']  # Φιλτράρισμα με βάση προβολή και κατάσταση
    search_fields = ['customer_name', 'customer_email']  # Αναζήτηση με βάση όνομα και email πελάτη
    ordering_fields = ['booking_date', 'total_price']  # Πεδία ταξινόμησης
    ordering = ['-booking_date']  # Προεπιλεγμένη ταξινόμηση

    @inject
    def get_queryset(self, service: BookingService = Provide[Container.booking_service]):
        return service.queryset_for_user(self.request.user)
