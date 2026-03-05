"""
Authentication serializers — registration, login profile, and customer display.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from ..models import Customer


class ChangePasswordSerializer(serializers.Serializer):
    """Change password for the authenticated user."""

    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            raise serializers.ValidationError({"detail": "Authentication required"})

        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({"old_password": "Old password is incorrect"})

        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password": "Passwords do not match"})

        return attrs

    def save(self, **kwargs):
        request = self.context["request"]
        user = request.user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class CustomerSerializer(serializers.ModelSerializer):
    """Read-only serializer for an existing Customer profile."""
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'username', 'email', 'full_name', 'phone', 'created_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Create a new User + Customer profile in a single request.
    Validates that passwords match and that the email is unique.
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
            raise serializers.ValidationError({"password": "Passwords do not match"})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "This email is already in use"})
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
        Customer.objects.create(user=user, phone=phone)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """View / update an authenticated user's profile."""
    phone = serializers.CharField(source='customer_profile.phone', required=False, allow_blank=True)
    # Support both 'password' and 'new_password' to be safe with frontend
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    new_password = serializers.CharField(write_only=True, required=False, validators=[validate_password])

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'password', 'new_password']
        read_only_fields = ['username']

    def update(self, instance, validated_data):
        # 1. Password Update
        password = validated_data.pop('password', None)
        new_password = validated_data.pop('new_password', None)
        
        final_password = password or new_password
        if final_password:
            instance.set_password(final_password)
            instance.save()

        # 2. Phone Update
        # Due to source='customer_profile.phone', DRF nests the phone inside customer_profile dict
        customer_data = validated_data.pop('customer_profile', {})
        phone = customer_data.get('phone')

        if phone is not None:
            Customer.objects.update_or_create(
                user=instance,
                defaults={'phone': phone}
            )

        # 3. Standard User Fields Update (email, first_name, last_name)
        return super().update(instance, validated_data)
