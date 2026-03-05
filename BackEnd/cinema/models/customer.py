"""
Customer model — extends Django User with a phone number and timestamps.
Each User can have at most one Customer profile (OneToOneField).
"""

from django.db import models
from django.contrib.auth.models import User


class Customer(models.Model):
    """
    Customer profile — one-to-one extension of Django's auth User.
    Stores additional contact info (phone) and audit timestamps.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='customer_profile',
        verbose_name="User"
    )
    phone = models.CharField(
        max_length=20,
        verbose_name="Phone",
        blank=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Created At"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Updated At"
    )

    class Meta:
        verbose_name = "Customer"
        verbose_name_plural = "Customers"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}"

    @property
    def email(self):
        """Shortcut to the underlying User email."""
        return self.user.email

    @property
    def full_name(self):
        """Shortcut to the user's full name, falling back to username."""
        return self.user.get_full_name() or self.user.username
