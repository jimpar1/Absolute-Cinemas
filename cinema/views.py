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
from .models import Movie, Screening, Booking
from .serializers import MovieSerializer, ScreeningSerializer, BookingSerializer


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
    filterset_fields = ['movie', 'screen_number']  # Φιλτράρισμα με βάση ταινία και αίθουσα
    ordering_fields = ['start_time', 'price', 'available_seats']  # Πεδία ταξινόμησης
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

