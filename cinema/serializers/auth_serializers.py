"""
Authentication serializers — registration, login profile, and customer display.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from ..models import Customer


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

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone']
        read_only_fields = ['username']

    def update(self, instance, validated_data):
        customer_data = validated_data.pop('customer_profile', {})
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()

        if hasattr(instance, 'customer_profile'):
            instance.customer_profile.phone = customer_data.get('phone', instance.customer_profile.phone)
            instance.customer_profile.save()
        else:
            Customer.objects.create(user=instance, phone=customer_data.get('phone', ''))
        return instance
