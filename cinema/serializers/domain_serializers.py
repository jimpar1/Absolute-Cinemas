"""
Domain serializers — MovieHall, Movie, Screening, Booking.
These correspond to the cinema's core data models.
"""

from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from ..models import Movie, Screening, Booking, MovieHall, HallPhoto


class HallPhotoSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HallPhoto
        fields = ['id', 'image', 'image_url', 'order']
        extra_kwargs = {'image': {'write_only': True, 'required': True}}

    def get_image_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return f"http://127.0.0.1:8000{obj.image.url}"


class MovieHallSerializer(serializers.ModelSerializer):
    """Serializer for cinema halls (id, name, capacity, layout JSON)."""
    photos = HallPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = MovieHall
        fields = ['id', 'name', 'capacity', 'layout', 'photos']


class MovieSerializer(serializers.ModelSerializer):
    """
    Serializer for movies. The ``status`` field is overridden with a
    computed value based on whether the movie has screenings this week.
    """
    status = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = [
            'id', 'title', 'description', 'duration', 'genre', 'director',
            'release_year', 'rating', 'status', 'poster_url', 'trailer_url',
            'shots', 'actors', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_status(self, obj):
        """Use the dynamic computed_status property rather than the DB field."""
        return obj.computed_status


class ScreeningSerializer(serializers.ModelSerializer):
    """
    Serializer for screenings.
    Includes nested read-only fields for the movie and hall.
    """
    movie_title = serializers.CharField(source='movie.title', read_only=True)
    movie_details = MovieSerializer(source='movie', read_only=True)
    hall_name = serializers.CharField(source='hall.name', read_only=True)
    hall_layout = serializers.JSONField(source='hall.layout', read_only=True)
    end_time = serializers.DateTimeField(read_only=True)
    total_seats = serializers.IntegerField(read_only=True)

    class Meta:
        model = Screening
        fields = [
            'id', 'movie', 'movie_title', 'movie_details',
            'hall', 'hall_name', 'hall_layout',
            'start_time', 'end_time', 'price',
            'available_seats', 'total_seats',
        ]
        read_only_fields = ['end_time', 'total_seats', 'available_seats']

    def validate(self, attrs):
        """Enforce Screening.clean() rules (time alignment + overlap) via the API."""
        instance = getattr(self, "instance", None)

        movie = attrs.get("movie") or (getattr(instance, "movie", None) if instance else None)
        hall = attrs.get("hall") or (getattr(instance, "hall", None) if instance else None)
        start_time = attrs.get("start_time") or (getattr(instance, "start_time", None) if instance else None)
        price = attrs.get("price") if "price" in attrs else (getattr(instance, "price", None) if instance else None)

        if movie is not None and hall is not None and start_time is not None:
            temp = Screening(movie=movie, hall=hall, start_time=start_time, price=price or 0)
            # Exclude self from overlap queries on update
            if instance is not None and getattr(instance, "pk", None) is not None:
                temp.pk = instance.pk
                # available_seats is a required model field, but it's read-only in the API.
                # Provide a safe value to satisfy model validation if full_clean is ever invoked.
                temp.available_seats = getattr(instance, "available_seats", 0)
            else:
                # On create, available_seats is auto-set in model.save; for validation we just need a non-negative int.
                temp.available_seats = 0

            try:
                temp.clean()
            except DjangoValidationError as exc:
                # Django may raise dict(field->msg) or a plain string.
                if hasattr(exc, "message_dict"):
                    raise serializers.ValidationError(exc.message_dict)
                raise serializers.ValidationError({"detail": exc.messages})

        return attrs


class BookingSerializer(serializers.ModelSerializer):
    """
    Serializer for bookings.
    Auto-links to authenticated user, validates seat availability & locks.
    """
    screening_details = ScreeningSerializer(source='screening', read_only=True)
    movie_title = serializers.CharField(source='screening.movie.title', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    session_id = serializers.CharField(write_only=True, required=False)
    seats_booked = serializers.IntegerField(min_value=1)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'user_username',
            'screening', 'screening_details', 'movie_title',
            'customer_name', 'customer_email', 'customer_phone',
            'seats_booked', 'seat_numbers', 'session_id',
            'total_price', 'booking_date', 'status',
            'stripe_payment_intent_id', 'payment_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'booking_date', 'total_price',
                            'stripe_payment_intent_id', 'payment_status',
                            'created_at', 'updated_at']

    def create(self, validated_data):
        """Auto-fill customer info from the authenticated user and clear seat locks."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
            if not validated_data.get('customer_name'):
                validated_data['customer_name'] = request.user.get_full_name() or request.user.username
            if not validated_data.get('customer_email'):
                validated_data['customer_email'] = request.user.email
            if not validated_data.get('customer_phone') and hasattr(request.user, 'customer_profile'):
                validated_data['customer_phone'] = request.user.customer_profile.phone

        session_id = validated_data.pop('session_id', None)
        booking = super().create(validated_data)

        # Remove seat locks that belonged to this booking session
        if session_id and booking.seat_numbers:
            from ..models import SeatLock
            seats = [s.strip() for s in booking.seat_numbers.split(',') if s.strip()]
            SeatLock.objects.filter(
                screening=booking.screening,
                seat_number__in=seats,
                session_id=session_id
            ).delete()

        return booking

    def validate(self, data):
        """Ensure enough seats are available and no locks conflict."""
        screening = data.get('screening')
        seats_booked = data.get('seats_booked')
        seat_numbers_str = data.get('seat_numbers', '')
        session_id = data.get('session_id')

        if screening and seats_booked:
            if seats_booked > screening.available_seats:
                raise serializers.ValidationError(
                    {'seats_booked': f"Not enough seats. Available: {screening.available_seats}"}
                )

            if seat_numbers_str:
                requested_seats = [s.strip() for s in seat_numbers_str.split(',') if s.strip()]

                # Check already-booked seats
                from ..models import Booking as BookingModel
                booked_qs = BookingModel.objects.filter(screening=screening)
                all_booked = []
                for b in booked_qs:
                    if b.seat_numbers:
                        all_booked.extend([s.strip() for s in b.seat_numbers.split(',') if s.strip()])

                for seat in requested_seats:
                    if seat in all_booked:
                        raise serializers.ValidationError({'seat_numbers': f"Seat {seat} is already booked."})

                # Check active locks from other sessions
                from ..models import SeatLock
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
                            {'seat_numbers': f"Seat {lock.seat_number} is being selected by another user."}
                        )

        return data

    def validate_seats_booked(self, value):
        """Handle the edge case where seats_booked arrives as a list."""
        if isinstance(value, list):
            value = value[0] if len(value) == 1 else len(value)
        try:
            value = int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Enter a valid integer.")
        return value
