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
from .models import Movie, Screening, Booking, MovieHall


@admin.register(MovieHall)
class MovieHallAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το MovieHall model στο admin panel
    """
    list_display = ('name', 'capacity')
    search_fields = ('name',)


class TMDBSearchForm(forms.Form):
    query = forms.CharField(label='Search TMDB for Movie', max_length=200, widget=forms.TextInput(attrs={'placeholder': 'Enter movie title'}))


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το Movie model στο admin panel
    """
    list_display = ['title', 'director', 'genre', 'release_year', 'rating', 'duration']
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
                        'poster_url': f"https://image.tmdb.org/t/p/w500{movie_details.get('poster_path', '')}" if movie_details.get('poster_path') else None,
                    }
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
    class Meta:
        model = Screening
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make the time part of start_time required
        self.fields['start_time'].widget.widgets[1].attrs['required'] = True

    def clean(self):
        cleaned_data = super().clean()
        # The model's clean method will be called automatically
        return cleaned_data


@admin.register(Screening)
class ScreeningAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το Screening model στο admin panel
    """
    form = ScreeningAdminForm
    list_display = ['movie', 'hall', 'start_time', 'end_time', 'available_seats', 'total_seats']
    list_filter = ['hall', 'start_time']
    search_fields = ['movie__title', 'hall__name']
    ordering = ['start_time']

    readonly_fields = ('end_time', 'total_seats', 'available_seats')


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """
    Ρυθμίσεις για το Booking model στο admin panel
    """
    list_display = ['id', 'customer_name', 'screening', 'seats_booked', 'total_price', 'status', 'booking_date']
    list_filter = ['status', 'booking_date']
    search_fields = ['customer_name', 'customer_email', 'screening__movie__title']
    ordering = ['-booking_date']
