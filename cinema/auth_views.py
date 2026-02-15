"""
Authentication Views - Χειρισμός εγγραφής, login και profile
Authentication Views - Handling registration, login and profile management

Endpoints:
- POST /api/auth/register/ - Εγγραφή νέου χρήστη
- POST /api/auth/login/ - Login και λήψη JWT tokens
- POST /api/auth/logout/ - Logout
- GET/PUT /api/auth/profile/ - Προβολή/ενημέρωση προφίλ
- GET /api/auth/my-bookings/ - Οι κρατήσεις του χρήστη
"""

from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Customer, Booking
from .serializers import (
    CustomerSerializer, 
    UserRegistrationSerializer,
    UserProfileSerializer,
    BookingSerializer
)


class RegisterView(generics.CreateAPIView):
    """
    Endpoint για εγγραφή νέου χρήστη
    Register new customer account
    
    POST /api/auth/register/
    {
        "username": "john_doe",
        "email": "john@example.com",
        "password": "securepass123",
        "password2": "securepass123",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "6912345678"
    }
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Δημιουργία JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Η εγγραφή ολοκληρώθηκε επιτυχώς!'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    Endpoint για login χρήστη
    User login endpoint
    
    POST /api/auth/login/
    {
        "username": "john_doe",
        "password": "securepass123"
    }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({
                'error': 'Παρακαλώ δώστε username και password'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if user is None:
            return Response({
                'error': 'Λάθος username ή password'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Δημιουργία JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Λήψη customer profile αν υπάρχει
        customer_profile = None
        try:
            customer_profile = {
                'phone': user.customer_profile.phone,
            }
        except Customer.DoesNotExist:
            pass

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'customer_profile': customer_profile
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': f'Καλώς ήρθες, {user.first_name or user.username}!'
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Endpoint για logout χρήστη (blacklist του refresh token)
    User logout endpoint
    
    POST /api/auth/logout/
    {
        "refresh": "refresh_token_here"
    }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({
                    'error': 'Το refresh token είναι απαραίτητο'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({
                'message': 'Επιτυχής αποσύνδεση!'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Μη έγκυρο token'
            }, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint για προβολή και ενημέρωση προφίλ χρήστη
    View and update user profile
    
    GET /api/auth/profile/
    PUT /api/auth/profile/
    {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "6912345678"
    }
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


class MyBookingsView(generics.ListAPIView):
    """
    Endpoint για προβολή των κρατήσεων του συνδεδεμένου χρήστη
    View authenticated user's bookings
    
    GET /api/auth/my-bookings/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-booking_date')
