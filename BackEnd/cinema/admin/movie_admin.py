"""
MovieAdmin — admin panel config for movies.
Includes a custom "Add from TMDB" view that replaces the default add form.
"""

from decimal import Decimal
from django.contrib import admin
from django.shortcuts import render, redirect
from django import forms
from ..models import Movie


class TMDBSearchForm(forms.Form):
    """Simple form for the TMDB search bar in the admin."""
    query = forms.CharField(
        label='Search TMDB for Movie', max_length=200,
        widget=forms.TextInput(attrs={'placeholder': 'Enter movie title'})
    )


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    """
    Movie admin with TMDB import.
    The default "Add" redirects to a custom TMDB search/select page.
    """
    list_display = ['title', 'director', 'genre', 'release_year', 'rating', 'status', 'duration']
    list_filter = ['genre', 'release_year']
    search_fields = ['title', 'director', 'genre']
    ordering = ['-created_at']

    def add_view(self, request, form_url='', extra_context=None):
        """Redirect the default add page to the TMDB import view."""
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

    # ── Custom "Add from TMDB" view ──

    def add_from_tmdb_view(self, request):
        """
        Three-phase view:
        1. GET  → show empty search form
        2. POST with query → show TMDB search results
        3. POST with tmdb_id → fetch details and create the Movie
        """
        from ..tmdb_service import search_movies

        if request.method == 'POST':
            # Phase 3: user picked a movie from the search results
            if 'tmdb_id' in request.POST:
                result = self._create_from_tmdb(request, request.POST.get('tmdb_id'))
                if result is not None:  # redirect on success
                    return result

            # Phase 2: user submitted a search query
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

        # Phase 1: initial GET
        form = TMDBSearchForm()
        context = self.admin_site.each_context(request)
        context.update({'form': form, 'title': 'Add Movie from TMDB'})
        return render(request, 'admin/cinema/movie/add_from_tmdb.html', context)

    def _create_from_tmdb(self, request, tmdb_id):
        """Fetch TMDB details and create a Movie. Returns a redirect or None on error."""
        from ..tmdb_service import get_movie_details

        movie_details = get_movie_details(tmdb_id)
        if not movie_details:
            self.message_user(request, 'Movie not found in TMDB.')
            return None

        movie_data = {
            'title': movie_details.get('title', ''),
            'description': movie_details.get('overview', ''),
            'duration': movie_details.get('runtime', 0),
            'genre': ', '.join([g['name'] for g in movie_details.get('genres', [])]),
            'director': self._get_director_from_credits(movie_details.get('credits', {})),
            'release_year': int(movie_details.get('release_date', '0000-00-00')[:4]) if movie_details.get('release_date') else 0,
            'rating': Decimal(str(round(movie_details.get('vote_average', 0), 1))),
            'status': 'upcoming' if (movie_details.get('release_date') and int(movie_details.get('release_date')[:4]) >= 2025) else 'now_playing',
            'poster_url': f"https://image.tmdb.org/t/p/w500{movie_details.get('poster_path', '')}" if movie_details.get('poster_path') else None,
        }

        # Trailer
        videos = movie_details.get('videos', {}).get('results', [])
        trailer_url = None
        for video in videos:
            if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                trailer_url = f"https://www.youtube.com/watch?v={video['key']}"
                break
        movie_data['trailer_url'] = trailer_url

        # Scene shots
        images = movie_details.get('images', {}).get('backdrops', [])
        shots = [f"https://image.tmdb.org/t/p/original{img['file_path']}" for img in images[:5]]
        movie_data['shots'] = shots if shots else None

        # Cast
        credits = movie_details.get('credits', {})
        cast = credits.get('cast', [])
        actors = [
            {'name': a['name'], 'character': a.get('character', ''),
             'profile_path': f"https://image.tmdb.org/t/p/w500{a['profile_path']}" if a.get('profile_path') else None}
            for a in cast[:10]
        ]
        movie_data['actors'] = actors if actors else None

        # Validate and save
        if not movie_data['title']:
            self.message_user(request, 'Movie title is required.')
            return None
        if movie_data['duration'] <= 0:
            self.message_user(request, 'Movie duration must be greater than 0.')
            return None
        if not movie_data['genre']:
            movie_data['genre'] = 'Unknown'
        if not movie_data['director']:
            movie_data['director'] = 'Unknown'

        movie = Movie(**movie_data)
        movie.save()
        self.message_user(request, f'Movie "{movie.title}" added successfully from TMDB.')
        return redirect('admin:cinema_movie_changelist')

    @staticmethod
    def _get_director_from_credits(credits):
        """Extract director name from TMDB credits payload."""
        if not credits or 'crew' not in credits:
            return 'Unknown'
        for crew_member in credits['crew']:
            if crew_member.get('job') == 'Director':
                return crew_member.get('name', 'Unknown')
        return 'Unknown'
