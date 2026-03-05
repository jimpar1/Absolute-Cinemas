"""MovieHallAdmin — admin panel config for cinema halls."""

from django.contrib import admin
from ..models import MovieHall, HallPhoto


class HallPhotoInline(admin.StackedInline):
    model = HallPhoto
    extra = 1
    fields = ('image', 'order')


@admin.register(MovieHall)
class MovieHallAdmin(admin.ModelAdmin):
    """Organises hall fields into collapsible fieldsets for easy editing."""
    list_display = ('name', 'capacity', 'left_section_capacity', 'middle_section_capacity', 'right_section_capacity')
    search_fields = ('name',)
    readonly_fields = ('capacity',)
    inlines = [HallPhotoInline]
    fieldsets = (
        ('General', {
            'fields': ('name', 'capacity'),
        }),
        ('Main Floor – Capacity', {
            'fields': ('left_section_capacity', 'middle_section_capacity', 'right_section_capacity'),
        }),
        ('Main Floor – Seats per Row (0 = auto)', {
            'fields': ('left_seats_per_row', 'middle_seats_per_row', 'right_seats_per_row'),
            'classes': ('collapse',),
        }),
        ('Balcony – Capacity', {
            'fields': ('balcony_left_capacity', 'balcony_middle_capacity', 'balcony_right_capacity'),
            'classes': ('collapse',),
        }),
        ('Balcony – Seats per Row (0 = auto)', {
            'fields': ('balcony_left_seats_per_row', 'balcony_middle_seats_per_row', 'balcony_right_seats_per_row'),
            'classes': ('collapse',),
        }),
    )


