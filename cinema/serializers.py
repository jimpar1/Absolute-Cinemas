"""
Αρχείο serializers.py - Ορισμός των serializers για το REST API
Serializers file - Definition of serializers for REST API

Οι serializers μετατρέπουν τα Django models σε JSON format και αντίστροφα.
Χρησιμοποιούνται από το Django REST Framework για να δημιουργήσουν API endpoints.

Περιέχει serializers για:
- Movie (Ταινία)
- Screening (Προβολή)
- Booking (Κράτηση)
"""

from rest_framework import serializers
from .models import Movie, Screening, Booking, MovieHall


class MovieHallSerializer(serializers.ModelSerializer):
    """
    Serializer for the MovieHall model
    """
    class Meta:
        model = MovieHall
        fields = ['id', 'name', 'capacity']


class MovieSerializer(serializers.ModelSerializer):
    """
    Serializer για το Movie model
    Μετατρέπει τα Movie objects σε JSON και αντίστροφα
    """
    class Meta:
        model = Movie
        fields = [
            'id',
            'title',
            'description',
            'duration',
            'genre',
            'director',
            'release_year',
            'rating',
            'status',
            'poster_url',
            'trailer_url',
            'shots',
            'actors',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']  # Αυτά τα πεδία δεν μπορούν να τροποποιηθούν από το API


class ScreeningSerializer(serializers.ModelSerializer):
    """
    Serializer για το Screening model
    Μετατρέπει τις ιδιότητες σε JSON-συμβατές τιμές για το API
    """
    movie_title = serializers.CharField(source='movie.title', read_only=True)
    movie_details = MovieSerializer(source='movie', read_only=True)
    # Keep 'hall' as the writable FK (default behavior of ModelSerializer) and add a read-only hall_name
    hall_name = serializers.CharField(source='hall.name', read_only=True)

    # Serialize computed properties explicitly to JSON-friendly types (no redundant `source`)
    end_time = serializers.DateTimeField(read_only=True)
    total_seats = serializers.IntegerField(read_only=True)

    class Meta:
        model = Screening
        fields = [
            'id',
            'movie',
            'movie_title',
            'movie_details',
            'hall',
            'hall_name',
            'start_time',
            'end_time',
            'price',
            'available_seats',
            'total_seats',
        ]
        read_only_fields = ['end_time', 'total_seats', 'available_seats']


class BookingSerializer(serializers.ModelSerializer):
    """
    Serializer για το Booking model
    Μετατρέπει τα Booking objects σε JSON και αντίστροφα
    Περιλαμβάνει πληροφορίες για την προβολή και την ταινία
    """
    screening_details = ScreeningSerializer(source='screening', read_only=True)  # Πλήρεις πληροφορίες προβολής
    movie_title = serializers.CharField(source='screening.movie.title', read_only=True)  # Τίτλος ταινίας
    
    seats_booked = serializers.IntegerField(min_value=1)

    class Meta:
        model = Booking
        fields = [
            'id',
            'screening',
            'screening_details',
            'movie_title',
            'customer_name',
            'customer_email',
            'customer_phone',
            'seats_booked',
            'total_price',
            'booking_date',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['booking_date', 'total_price', 'created_at', 'updated_at']  # total_price υπολογίζεται αυτόματα
    
    def validate(self, data):
        """
        Έλεγχος δεδομένων πριν τη δημιουργία/ενημέρωση κράτησης
        Validation before creating/updating a booking
        """
        screening = data.get('screening')
        seats_booked = data.get('seats_booked')
        
        # Έλεγχος αν υπάρχουν αρκετές διαθέσιμες θέσεις
        if screening and seats_booked:
            if seats_booked > screening.available_seats:
                raise serializers.ValidationError(
                    {'seats_booked': f"Δεν υπάρχουν αρκετές διαθέσιμες θέσεις. Διαθέσιμες: {screening.available_seats}"}
                )
        
        return data

    def validate_seats_booked(self, value):
        """
        Custom validation for seats_booked to handle if it's sent as list
        """
        if isinstance(value, list):
            if len(value) == 1:
                value = value[0]
            else:
                value = len(value)  # or sum, but probably len
        try:
            value = int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Enter a valid integer.")
        return value
