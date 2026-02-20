"""
Αρχείο admin.py - Ρυθμίσεις Django Admin
Admin file - Django Admin configuration

Καταχωρεί τα models στο Django admin panel για εύκολη διαχείριση
από το web interface.
"""

from django.contrib import admin
from django.shortcuts import render, redirect
from django.urls import reverse
from django import forms
from decimal import Decimal
from .models import Movie, Screening, Booking, MovieHall, Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το Customer model στο admin panel
    """
    list_display = ('user', 'email', 'phone', 'created_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'phone')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    def email(self, obj):
        return obj.user.email
    email.short_description = 'Email'


@admin.register(MovieHall)
class MovieHallAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το MovieHall model στο admin panel
    """
    list_display = ('name', 'capacity', 'left_section_capacity', 'middle_section_capacity', 'right_section_capacity')
    search_fields = ('name',)
    readonly_fields = ('capacity',)
    fieldsets = (
        ('Γενικά', {
            'fields': ('name', 'capacity'),
        }),
        ('Πλατεία – Χωρητικότητα', {
            'fields': ('left_section_capacity', 'middle_section_capacity', 'right_section_capacity'),
        }),
        ('Πλατεία – Θέσεις ανά Σειρά (0 = αυτόματα)', {
            'fields': ('left_seats_per_row', 'middle_seats_per_row', 'right_seats_per_row'),
            'classes': ('collapse',),
        }),
        ('Εξώστης – Χωρητικότητα', {
            'fields': ('balcony_left_capacity', 'balcony_middle_capacity', 'balcony_right_capacity'),
            'classes': ('collapse',),
        }),
        ('Εξώστης – Θέσεις ανά Σειρά (0 = αυτόματα)', {
            'fields': ('balcony_left_seats_per_row', 'balcony_middle_seats_per_row', 'balcony_right_seats_per_row'),
            'classes': ('collapse',),
        }),
    )


class TMDBSearchForm(forms.Form):
    query = forms.CharField(label='Search TMDB for Movie', max_length=200, widget=forms.TextInput(attrs={'placeholder': 'Enter movie title'}))


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το Movie model στο admin panel
    """
    list_display = ['title', 'director', 'genre', 'release_year', 'rating', 'status', 'duration']
    list_filter = ['genre', 'release_year']
    search_fields = ['title', 'director', 'genre']
    ordering = ['-created_at']

    def add_view(self, request, form_url='', extra_context=None):
        return redirect('admin:cinema_movie_add_from_tmdb')

    def has_add_permission(self, request):
        return True

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('add_from_tmdb/', self.add_from_tmdb_view, name='cinema_movie_add_from_tmdb'),
        ]
        return custom_urls + urls

    def add_from_tmdb_view(self, request):
        from .tmdb_service import search_movies, get_movie_details

        if request.method == 'POST':
            # Case 2: A movie from the search results is selected to be added.
            if 'tmdb_id' in request.POST:
                tmdb_id = request.POST.get('tmdb_id')
                movie_details = get_movie_details(tmdb_id)
                if not movie_details:
                    self.message_user(request, 'Movie not found in TMDB.')
                else:
                    movie_data = {
                        'title': movie_details.get('title', ''),
                        'description': movie_details.get('overview', ''),
                        'duration': movie_details.get('runtime', 0),
                        'genre': ', '.join([genre['name'] for genre in movie_details.get('genres', [])]),
                        'director': self._get_director_from_credits(movie_details.get('credits', {})),
                        'release_year': int(movie_details.get('release_date', '0000-00-00')[:4]) if movie_details.get('release_date') else 0,
                        'rating': Decimal(str(round(movie_details.get('vote_average', 0), 1))),
                        'status': 'upcoming' if (movie_details.get('release_date') and int(movie_details.get('release_date')[:4]) >= 2025) else 'now_playing',
                        'poster_url': f"https://image.tmdb.org/t/p/w500{movie_details.get('poster_path', '')}" if movie_details.get('poster_path') else None,
                    }

                    # Extract trailer URL
                    videos = movie_details.get('videos', {}).get('results', [])
                    trailer_url = None
                    for video in videos:
                        if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                            trailer_url = f"https://www.youtube.com/watch?v={video['key']}"
                            break
                    movie_data['trailer_url'] = trailer_url

                    # Extract shots (use original quality for best resolution)
                    images = movie_details.get('images', {}).get('backdrops', [])
                    shots = [f"https://image.tmdb.org/t/p/original{img['file_path']}" for img in images[:5]]
                    movie_data['shots'] = shots if shots else None

                    # Extract actors
                    credits = movie_details.get('credits', {})
                    cast = credits.get('cast', [])
                    actors = [{'name': actor['name'], 'character': actor.get('character', ''), 'profile_path': f"https://image.tmdb.org/t/p/w500{actor['profile_path']}" if actor.get('profile_path') else None} for actor in cast[:10]]
                    movie_data['actors'] = actors if actors else None

                    if not movie_data['title']:
                        self.message_user(request, 'Movie title is required.')
                    elif movie_data['duration'] <= 0:
                        self.message_user(request, 'Movie duration must be greater than 0.')
                    else:
                        if not movie_data['genre']:
                            movie_data['genre'] = 'Unknown'
                        if not movie_data['director']:
                            movie_data['director'] = 'Unknown'
                        movie = Movie(**movie_data)
                        movie.save()
                        self.message_user(request, f'Movie "{movie.title}" added successfully from TMDB.')
                        return redirect('admin:cinema_movie_changelist')

            # Case 1: The user is searching for a movie.
            form = TMDBSearchForm(request.POST)
            if form.is_valid():
                query = form.cleaned_data['query']
                results = search_movies(query)
                context = self.admin_site.each_context(request)
                context.update({
                    'form': form,
                    'title': 'Add Movie from TMDB',
                    'results': results.get('results', []) if results else [],
                })
                return render(request, 'admin/cinema/movie/add_from_tmdb.html', context)

        # Initial GET request: show the search form.
        form = TMDBSearchForm()
        context = self.admin_site.each_context(request)
        context.update({
            'form': form,
            'title': 'Add Movie from TMDB',
        })
        return render(request, 'admin/cinema/movie/add_from_tmdb.html', context)

    def _get_director_from_credits(self, credits):
        """
        Helper method to extract director name from TMDB credits
        """
        if not credits or 'crew' not in credits:
            return 'Unknown'

        for crew_member in credits['crew']:
            if crew_member.get('job') == 'Director':
                return crew_member.get('name', 'Unknown')

        return 'Unknown'


class ScreeningAdminForm(forms.ModelForm):
    # Extra fields for weekly repetition (only shown when creating new screenings)
    repeat_weekly = forms.BooleanField(
        required=False,
        label='Repeat weekly',
        help_text='Create this screening at the same time for multiple weeks'
    )
    repeat_weeks = forms.IntegerField(
        required=False,
        min_value=1,
        max_value=52,
        initial=4,
        label='Number of extra weeks',
        help_text='How many additional weeks to repeat (1-52)'
    )

    class Meta:
        model = Screening
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make the time part of start_time required
        self.fields['start_time'].widget.widgets[1].attrs['required'] = True
        # Hide repetition fields when editing an existing screening
        if self.instance and self.instance.pk:
            self.fields['repeat_weekly'].widget = forms.HiddenInput()
            self.fields['repeat_weeks'].widget = forms.HiddenInput()

    def clean(self):
        cleaned_data = super().clean()
        # If repeat is enabled, require repeat_weeks
        if cleaned_data.get('repeat_weekly') and not cleaned_data.get('repeat_weeks'):
            raise forms.ValidationError({'repeat_weeks': 'Specify the number of weeks to repeat.'})
        return cleaned_data


@admin.register(Screening)
class ScreeningAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το Screening model στο admin panel
    Supports creating weekly recurring screenings with automatic conflict detection.
    """
    form = ScreeningAdminForm
    list_display = ['movie', 'hall', 'start_time', 'end_time', 'available_seats', 'total_seats']
    list_filter = ['hall', 'start_time']
    search_fields = ['movie__title', 'hall__name']
    ordering = ['start_time']

    readonly_fields = ('end_time', 'total_seats', 'available_seats')

    fieldsets = (
        (None, {
            'fields': ('movie', 'hall', 'start_time', 'price'),
        }),
        ('Computed Fields', {
            'fields': ('end_time', 'total_seats', 'available_seats'),
        }),
        ('Weekly Repetition', {
            'fields': ('repeat_weekly', 'repeat_weeks'),
            'description': 'Optionally repeat this screening at the same day/time for multiple weeks. '
                           'Weeks with hall conflicts will be automatically skipped.',
        }),
    )

    def save_model(self, request, obj, form, change):
        """
        Override save_model to handle weekly repetition.
        After saving the main screening, create copies for each subsequent week,
        skipping any that conflict with existing screenings in the same hall.
        """
        from datetime import timedelta
        from django.contrib import messages
        from django.core.exceptions import ValidationError

        # Save the original screening first
        super().save_model(request, obj, form, change)

        # Only process repetition for new screenings (not edits)
        if change:
            return

        repeat_weekly = form.cleaned_data.get('repeat_weekly', False)
        repeat_weeks = form.cleaned_data.get('repeat_weeks', 0)

        if not repeat_weekly or not repeat_weeks:
            return

        created = 0
        skipped_weeks = []

        for week in range(1, repeat_weeks + 1):
            new_start = obj.start_time + timedelta(weeks=week)

            # Create a new screening instance (not saved yet)
            new_screening = Screening(
                movie=obj.movie,
                hall=obj.hall,
                start_time=new_start,
                price=obj.price,
            )

            # Check for hall conflicts using the model's clean method
            try:
                new_screening.clean()
                new_screening.save()
                created += 1
            except ValidationError:
                skipped_weeks.append(new_start.strftime('%a %d %b %Y, %H:%M'))

        # Report results to the admin
        if created > 0:
            messages.success(
                request,
                f'✅ Created {created} additional weekly screening{"s" if created != 1 else ""}.'
            )
        if skipped_weeks:
            skipped_list = '; '.join(skipped_weeks)
            messages.warning(
                request,
                f'⚠️ Skipped {len(skipped_weeks)} week{"s" if len(skipped_weeks) != 1 else ""} '
                f'due to hall conflicts: {skipped_list}'
            )


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το Booking model στο admin panel
    """
    list_display = ['id', 'user_username', 'customer_name', 'screening', 'seats_booked', 'seat_numbers', 'total_price', 'status', 'booking_date']
    list_filter = ['status', 'booking_date']
    search_fields = ['user__username', 'customer_name', 'customer_email', 'screening__movie__title']
    ordering = ['-booking_date']
    readonly_fields = ['total_price', 'booking_date']
    
    def user_username(self, obj):
        return obj.user.username if obj.user else 'Guest'
    user_username.short_description = 'User'
