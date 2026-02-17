"""CustomerAdmin — admin panel config for the Customer (profile) model."""

from django.contrib import admin
from ..models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    """Display customer profiles with search and date filtering."""
    list_display = ('user', 'email', 'phone', 'created_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'phone')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')

    def email(self, obj):
        return obj.user.email
    email.short_description = 'Email'
