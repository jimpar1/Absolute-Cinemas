"""
Subscription model — tracks a customer's CinemaPass tier and weekly free ticket usage.
"""

from django.db import models
from django.utils import timezone
from datetime import timedelta

from .customer import Customer


def _this_monday():
    today = timezone.localdate()
    return today - timedelta(days=today.weekday())


class Subscription(models.Model):
    TIER_CHOICES = [('free', 'Free'), ('pro', 'Pro'), ('ultra', 'Ultra')]

    customer          = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='subscription')
    tier              = models.CharField(max_length=10, choices=TIER_CHOICES, default='free')
    started_at        = models.DateTimeField(auto_now_add=True)
    expires_at        = models.DateTimeField(null=True, blank=True)  # None = free forever
    free_tickets_used = models.IntegerField(default=0)               # used in current week
    week_start        = models.DateField(default=_this_monday)       # for reset detection

    class Meta:
        verbose_name = "Subscription"
        verbose_name_plural = "Subscriptions"

    def __str__(self):
        return f"{self.customer} — {self.tier}"
