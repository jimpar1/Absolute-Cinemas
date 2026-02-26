"""
SubscriptionAdmin — lets staff view and override customer subscription tiers.
"""

from django.contrib import admin
from ..models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display  = ('customer', 'tier', 'started_at', 'expires_at', 'free_tickets_used', 'week_start')
    list_filter   = ('tier',)
    search_fields = ('customer__user__username', 'customer__user__email')
    readonly_fields = ('started_at',)
