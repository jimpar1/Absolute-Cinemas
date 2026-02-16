"""
Authentication views — registration, login, logout, profile, and user bookings.

Endpoints:
  - POST /api/auth/register/    → Create a new user + customer profile
  - POST /api/auth/login/       → Authenticate and receive JWT tokens
  - POST /api/auth/logout/      → Blacklist the refresh token
  - GET/PUT /api/auth/profile/  → View / update the authenticated user's profile
  - GET /api/auth/my-bookings/  → List the authenticated user's bookings
"""

from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Customer
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    BookingSerializer
)

from dependency_injector.wiring import Provide, inject
from .container import Container
from .services import BookingService


class RegisterView(generics.CreateAPIView):
    """
    Register a new user account.
    Returns the created user info and JWT tokens.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id, 'username': user.username,
                'email': user.email, 'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Registration successful!'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    Authenticate a user and return JWT tokens.
    Returns user info including the customer profile if it exists.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {'error': 'Invalid username or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        customer_profile = None
        try:
            customer_profile = {'phone': user.customer_profile.phone}
        except Customer.DoesNotExist:
            pass

        return Response({
            'user': {
                'id': user.id, 'username': user.username,
                'email': user.email, 'first_name': user.first_name,
                'last_name': user.last_name,
                'customer_profile': customer_profile
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': f'Welcome, {user.first_name or user.username}!'
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Blacklist the refresh token to log the user out."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully!'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """View and update the authenticated user's profile."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


class MyBookingsView(generics.ListAPIView):
    """List the authenticated user's bookings, newest first."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BookingSerializer

    @inject
    def get_queryset(self, booking_service: BookingService = Provide[Container.booking_service]):
        return booking_service.my_bookings(self.request.user)


class ChangePasswordView(APIView):
    """Change password for the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)
