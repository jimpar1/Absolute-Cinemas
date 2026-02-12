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
from decimal import Decimal
from .models import Movie, Screening, Booking, MovieHall
from .serializers import MovieSerializer, ScreeningSerializer, BookingSerializer, MovieHallSerializer
from .tmdb_service import search_movies, get_popular_movies, get_movie_details  # Assuming these functions are defined in tmdb.py


class MovieHallViewSet(viewsets.ModelViewSet):
    """
    ViewSet for the MovieHall model
    Provides CRUD operations for movie halls
    """
    queryset = MovieHall.objects.all()
    serializer_class = MovieHallSerializer


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
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'director', 'genre']  # Αναζήτηση με βάση τον τίτλο, σκηνοθέτη, είδος
    ordering_fields = ['title', 'release_year', 'rating', 'created_at']  # Πεδία ταξινόμησης
    ordering = ['-created_at']  # Προεπιλεγμένη ταξινόμηση

    @action(detail=True, methods=['get'])
    def screenings(self, request, pk=None):
        """
        Custom action για να πάρουμε όλες τις προβολές μιας ταινίας
        GET /api/movies/{id}/screenings/
        """
        movie = self.get_object()
        screenings = movie.screenings.all()
        serializer = ScreeningSerializer(screenings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search_tmdb(self, request):
        """
        Custom action για αναζήτηση ταινιών στο TMDB
        GET /api/movies/search_tmdb/?query=<query>&page=<page>
        """
        query = request.query_params.get('query', '')
        page = int(request.query_params.get('page', 1))
        if not query:
            return Response({'error': 'Query parameter is required'}, status=400)
        results = search_movies(query, page)
        # Convert results to a serializable format
        if isinstance(results, dict):
            return Response(results)
        elif hasattr(results, '__dict__'):
            return Response(results.__dict__)
        else:
            return Response({'page': page, 'results': list(results) if results else []})

    @action(detail=False, methods=['get'])
    def popular_tmdb(self, request):
        """
        Custom action για δημοφιλείς ταινίες από TMDB
        GET /api/movies/popular_tmdb/?page=<page>
        """
        page = int(request.query_params.get('page', 1))
        results = get_popular_movies(page)
        # Convert results to a serializable format
        if isinstance(results, dict):
            return Response(results)
        elif hasattr(results, '__dict__'):
            return Response(results.__dict__)
        else:
            return Response({'page': page, 'results': list(results) if results else []})

    @action(detail=False, methods=['get'])
    def tmdb_details(self, request):
        """
        Custom action για λεπτομέρειες ταινίας από TMDB
        GET /api/movies/tmdb_details/?movie_id=<id>
        """
        movie_id = request.query_params.get('movie_id', '')
        if not movie_id:
            return Response({'error': 'movie_id parameter is required'}, status=400)
        details = get_movie_details(int(movie_id))
        if details:
            # Convert details to a serializable format
            if isinstance(details, dict):
                return Response(details)
            elif hasattr(details, '__dict__'):
                return Response(details.__dict__)
            else:
                return Response({'error': 'Invalid response format'}, status=500)
        return Response({'error': 'Movie not found'}, status=404)

    @action(detail=True, methods=['post'])
    def refresh_from_tmdb(self, request, pk=None):
        """
        Custom action για ανανέωση δεδομένων ταινίας από TMDB
        POST /api/movies/{id}/refresh_from_tmdb/
        """
        movie = self.get_object()

        # Search TMDB by title to find the movie
        search_results = search_movies(movie.title, page=1)
        if not search_results or 'results' not in search_results or not search_results['results']:
            return Response({'error': 'Movie not found on TMDB'}, status=404)

        # Take the first result
        tmdb_movie = search_results['results'][0]
        tmdb_id = tmdb_movie['id']

        # Get detailed TMDB data
        tmdb_details = get_movie_details(tmdb_id)
        if not tmdb_details:
            return Response({'error': 'Could not fetch TMDB details'}, status=404)

        # Extract trailer URL
        videos = tmdb_details.get('videos', {}).get('results', [])
        trailer_url = None
        for video in videos:
            if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                trailer_url = f"https://www.youtube.com/watch?v={video['key']}"
                break

        # Extract shots
        images = tmdb_details.get('images', {}).get('backdrops', [])
        shots = [f"https://image.tmdb.org/t/p/original{img['file_path']}" for img in images[:5]]
        shots = shots if shots else None

        # Extract actors
        credits = tmdb_details.get('credits', {})
        cast = credits.get('cast', [])
        actors = [{'name': actor['name'], 'character': actor.get('character', ''), 'profile_path': f"https://image.tmdb.org/t/p/w500{actor['profile_path']}" if actor.get('profile_path') else None} for actor in cast[:10]]
        actors = actors if actors else None

        # Update the movie
        movie.trailer_url = trailer_url
        movie.shots = shots
        movie.actors = actors
        movie.save()

        serializer = self.get_serializer(movie)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_from_tmdb(self, request):
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

        # Get movie details from TMDB
        movie_details = get_movie_details(tmdb_id)
        if not movie_details:
            return Response({'error': 'Movie not found in TMDB'}, status=404)

        # Extract data from TMDB response
        movie_data = {
            'title': movie_details.get('title', ''),
            'description': movie_details.get('overview', ''),
            'duration': movie_details.get('runtime', 0),
            'genre': ', '.join([genre['name'] for genre in movie_details.get('genres', [])]),
            'director': self._get_director_from_credits(movie_details.get('credits', {})),
            'release_year': int(movie_details.get('release_date', '0000-00-00')[:4]) if movie_details.get('release_date') else 0,
            'rating': Decimal(str(round(movie_details.get('vote_average', 0), 1))),
            'poster_url': f"https://image.tmdb.org/t/p/w500{movie_details.get('poster_path', '')}" if movie_details.get('poster_path') else None,
        }

        # Extract trailer URL
        videos = movie_details.get('videos', {}).get('results', [])
        trailer_url = None
        for video in videos:
            if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                trailer_url = f"https://www.youtube.com/watch?v={video['key']}"
                break
        movie_data['trailer_url'] = trailer_url

        # Extract shots (use original quality for best resolution)
        images = movie_details.get('images', {}).get('backdrops', [])
        shots = [f"https://image.tmdb.org/t/p/original{img['file_path']}" for img in images[:5]]
        movie_data['shots'] = shots if shots else None

        # Extract actors
        credits = movie_details.get('credits', {})
        cast = credits.get('cast', [])
        actors = [{'name': actor['name'], 'character': actor.get('character', ''), 'profile_path': f"https://image.tmdb.org/t/p/w500{actor['profile_path']}" if actor.get('profile_path') else None} for actor in cast[:10]]
        movie_data['actors'] = actors if actors else None

        # Validate required fields
        if not movie_data['title']:
            return Response({'error': 'Movie title is required'}, status=400)
        if movie_data['duration'] <= 0:
            return Response({'error': 'Movie duration must be greater than 0'}, status=400)
        if not movie_data['genre']:
            movie_data['genre'] = 'Unknown'
        if not movie_data['director']:
            movie_data['director'] = 'Unknown'

        # Create the movie
        serializer = self.get_serializer(data=movie_data)
        if serializer.is_valid():
            movie = serializer.save()
            return Response(serializer.data, status=201)
        else:
            return Response(serializer.errors, status=400)

    @action(detail=False, methods=['post'])
    def create_from_search(self, request):
        """
        Custom action για δημιουργία ταινίας από αναζήτηση στο TMDB
        POST /api/movies/create_from_search/
        Body: {"query": "Inception"}
        """
        query = request.data.get('query')
        if not query:
            return Response({'error': 'query is required'}, status=400)

        # Search TMDB for the query
        search_results = search_movies(query, page=1)
        if not search_results or 'results' not in search_results or not search_results['results']:
            return Response({'error': 'No movies found for the given query'}, status=404)

        # Take the first result
        first_movie = search_results['results'][0]
        tmdb_id = first_movie['id']

        # Now create from TMDB ID
        return self._create_movie_from_tmdb_id(tmdb_id)

    def _create_movie_from_tmdb_id(self, tmdb_id):
        """
        Helper method to create a movie from TMDB ID
        """
        # Get movie details from TMDB
        movie_details = get_movie_details(tmdb_id)
        if not movie_details:
            return Response({'error': 'Movie not found in TMDB'}, status=404)

        # Extract data from TMDB response
        movie_data = {
            'title': movie_details.get('title', ''),
            'description': movie_details.get('overview', ''),
            'duration': movie_details.get('runtime', 0),
            'genre': ', '.join([genre['name'] for genre in movie_details.get('genres', [])]),
            'director': self._get_director_from_credits(movie_details.get('credits', {})),
            'release_year': int(movie_details.get('release_date', '0000-00-00')[:4]) if movie_details.get('release_date') else 0,
            'rating': Decimal(str(round(movie_details.get('vote_average', 0), 1))),
            'poster_url': f"https://image.tmdb.org/t/p/w500{movie_details.get('poster_path', '')}" if movie_details.get('poster_path') else None,
        }

        # Extract trailer URL
        videos = movie_details.get('videos', {}).get('results', [])
        trailer_url = None
        for video in videos:
            if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                trailer_url = f"https://www.youtube.com/watch?v={video['key']}"
                break
        movie_data['trailer_url'] = trailer_url

        # Extract shots (use original quality for best resolution)
        images = movie_details.get('images', {}).get('backdrops', [])
        shots = [f"https://image.tmdb.org/t/p/original{img['file_path']}" for img in images[:5]]
        movie_data['shots'] = shots if shots else None

        # Extract actors
        credits = movie_details.get('credits', {})
        cast = credits.get('cast', [])
        actors = [{'name': actor['name'], 'character': actor.get('character', ''), 'profile_path': f"https://image.tmdb.org/t/p/w500{actor['profile_path']}" if actor.get('profile_path') else None} for actor in cast[:10]]
        movie_data['actors'] = actors if actors else None

        # Validate required fields
        if not movie_data['title']:
            return Response({'error': 'Movie title is required'}, status=400)
        if movie_data['duration'] <= 0:
            return Response({'error': 'Movie duration must be greater than 0'}, status=400)
        if not movie_data['genre']:
            movie_data['genre'] = 'Unknown'
        if not movie_data['director']:
            movie_data['director'] = 'Unknown'

        # Create the movie
        serializer = self.get_serializer(data=movie_data)
        if serializer.is_valid():
            movie = serializer.save()
            return Response(serializer.data, status=201)
        else:
            return Response(serializer.errors, status=400)

    def _get_director_from_credits(self, credits):
        """
        Helper method to extract director name from TMDB credits
        """
        if not credits or 'crew' not in credits:
            return 'Unknown'

        for crew_member in credits['crew']:
            if crew_member.get('job') == 'Director':
                return crew_member.get('name', 'Unknown')

        return 'Unknown'

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
    queryset = Screening.objects.all()
    serializer_class = ScreeningSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['movie', 'hall']  # Φιλτράρισμα με βάση ταινία και αίθουσα
    ordering_fields = ['start_time', 'available_seats']  # Πεδία ταξινόμησης
    ordering = ['start_time']  # Προεπιλεγμένη ταξινόμηση

    @action(detail=True, methods=['get'])
    def bookings(self, request, pk=None):
        """
        Custom action για να πάρουμε όλες τις κρατήσεις μιας προβολής
        GET /api/screenings/{id}/bookings/
        """
        screening = self.get_object()
        bookings = screening.bookings.all()
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


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
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['screening', 'status']  # Φιλτράρισμα με βάση προβολή και κατάσταση
    search_fields = ['customer_name', 'customer_email']  # Αναζήτηση με βάση όνομα και email πελάτη
    ordering_fields = ['booking_date', 'total_price']  # Πεδία ταξινόμησης
    ordering = ['-booking_date']  # Προεπιλεγμένη ταξινόμηση
