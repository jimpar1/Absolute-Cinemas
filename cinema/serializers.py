"""
Αρχείο serializers.py - Ορισμός των serializers για το REST API
Serializers file - Definition of serializers for REST API

Οι serializers μετατρέπουν τα Django models σε JSON format και αντίστροφα.
Χρησιμοποιούνται από το Django REST Framework για να δημιουργήσουν API endpoints.

Περιέχει serializers για:
- Customer (Πελάτης)
- Movie (Ταινία)
- Screening (Προβολή)
- Booking (Κράτηση)
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Movie, Screening, Booking, MovieHall, Customer


class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer για το Customer Profile model
    """
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'username', 'email', 'full_name', 'phone', 'created_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer για εγγραφή νέου χρήστη
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'first_name', 'last_name', 'phone']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Οι κωδικοί δεν ταιριάζουν"})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Αυτό το email χρησιμοποιείται ήδη"})
        
        return attrs

    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        validated_data.pop('password2')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Δημιουργία Customer profile
        Customer.objects.create(user=user, phone=phone)
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer για προβολή και ενημέρωση προφίλ χρήστη
    """
    phone = serializers.CharField(source='customer_profile.phone', required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone']
        read_only_fields = ['username']

    def update(self, instance, validated_data):
        customer_data = validated_data.pop('customer_profile', {})
        
        # Ενημέρωση User fields
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        
        # Ενημέρωση Customer profile
        if hasattr(instance, 'customer_profile'):
            instance.customer_profile.phone = customer_data.get('phone', instance.customer_profile.phone)
            instance.customer_profile.save()
        else:
            Customer.objects.create(user=instance, phone=customer_data.get('phone', ''))
        
        return instance


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
    user_username = serializers.CharField(source='user.username', read_only=True)
    session_id = serializers.CharField(write_only=True, required=False)
    
    seats_booked = serializers.IntegerField(min_value=1)

    class Meta:
        model = Booking
        fields = [
            'id',
            'user',
            'user_username',
            'screening',
            'screening_details',
            'movie_title',
            'customer_name',
            'customer_email',
            'customer_phone',
            'seats_booked',
            'seat_numbers',
            'session_id',
            'total_price',
            'booking_date',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['user', 'booking_date', 'total_price', 'created_at', 'updated_at']  # total_price υπολογίζεται αυτόματα
    
    def create(self, validated_data):
        """
        Αυτόματη σύνδεση με τον authenticated user αν υπάρχει
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
            # Αυτόματη συμπλήρωση από το user profile αν δεν δίνονται
            if not validated_data.get('customer_name'):
                validated_data['customer_name'] = request.user.get_full_name() or request.user.username
            if not validated_data.get('customer_email'):
                validated_data['customer_email'] = request.user.email
            if not validated_data.get('customer_phone') and hasattr(request.user, 'customer_profile'):
                validated_data['customer_phone'] = request.user.customer_profile.phone
        
        session_id = validated_data.pop('session_id', None)
        booking = super().create(validated_data)
        
        if session_id and booking.seat_numbers:
            from .models import SeatLock
            seats = [s.strip() for s in booking.seat_numbers.split(',') if s.strip()]
            SeatLock.objects.filter(
                screening=booking.screening,
                seat_number__in=seats,
                session_id=session_id
            ).delete()
            
        return booking
    
    def validate(self, data):
        """
        Έλεγχος δεδομένων πριν τη δημιουργία/ενημέρωση κράτησης
        Validation before creating/updating a booking
        """
        screening = data.get('screening')
        seats_booked = data.get('seats_booked')
        seat_numbers_str = data.get('seat_numbers', '')
        session_id = data.get('session_id')
        
        # Έλεγχος αν υπάρχουν αρκετές διαθέσιμες θέσεις
        if screening and seats_booked:
            if seats_booked > screening.available_seats:
                raise serializers.ValidationError(
                    {'seats_booked': f"Δεν υπάρχουν αρκετές διαθέσιμες θέσεις. Διαθέσιμες: {screening.available_seats}"}
                )
                
            if seat_numbers_str:
                requested_seats = [s.strip() for s in seat_numbers_str.split(',') if s.strip()]
                
                # Έλεγχος υπάρχοντων κρατήσεων
                from .models import Booking
                booked_qs = Booking.objects.filter(screening=screening)
                all_booked = []
                for b in booked_qs:
                    if b.seat_numbers:
                        all_booked.extend([s.strip() for s in b.seat_numbers.split(',') if s.strip()])
                
                for seat in requested_seats:
                    if seat in all_booked:
                        raise serializers.ValidationError({'seat_numbers': f"Η θέση {seat} έχει ήδη κρατηθεί."})

                # Έλεγχος locks
                from .models import SeatLock
                from django.utils import timezone
                from datetime import timedelta
                
                active_locks = SeatLock.objects.filter(
                    screening=screening,
                    seat_number__in=requested_seats,
                    created_at__gte=timezone.now() - timedelta(minutes=10)
                )
                
                for lock in active_locks:
                    if lock.session_id != session_id:
                        raise serializers.ValidationError(
                            {'seat_numbers': f"Η θέση {lock.seat_number} επεξεργάζεται από άλλον χρήστη."}
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
