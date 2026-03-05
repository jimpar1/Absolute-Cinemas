"""
Management command to refresh all movies from TMDB
Updates trailer_url, shots, and actors for all existing movies
"""

from django.core.management.base import BaseCommand
from cinema.models import Movie
from cinema.tmdb_service import search_movies, get_movie_details


class Command(BaseCommand):
    help = 'Refresh all movies with trailer, shots, and actors data from TMDB'

    def add_arguments(self, parser):
        parser.add_argument(
            '--only-missing',
            action='store_true',
            help='Only refresh movies that have null trailer_url, shots, or actors',
        )

    def handle(self, *args, **options):
        only_missing = options.get('only_missing', False)

        if only_missing:
            movies = Movie.objects.filter(
                trailer_url__isnull=True
            ) | Movie.objects.filter(
                shots__isnull=True
            ) | Movie.objects.filter(
                actors__isnull=True
            )
            movies = movies.distinct()
        else:
            movies = Movie.objects.all()

        total = movies.count()
        self.stdout.write(f'Found {total} movies to refresh')

        success_count = 0
        error_count = 0

        for movie in movies:
            self.stdout.write(f'Processing: {movie.title}...')

            # Search TMDB by title
            search_results = search_movies(movie.title, page=1)
            if not search_results or 'results' not in search_results or not search_results['results']:
                self.stdout.write(self.style.WARNING(f'  Not found on TMDB: {movie.title}'))
                error_count += 1
                continue

            # Get the first result's TMDB ID
            tmdb_id = search_results['results'][0]['id']

            # Get detailed TMDB data
            tmdb_details = get_movie_details(tmdb_id)
            if not tmdb_details:
                self.stdout.write(self.style.WARNING(f'  Could not fetch details: {movie.title}'))
                error_count += 1
                continue

            # Extract trailer URL
            videos = tmdb_details.get('videos', {}).get('results', [])
            trailer_url = None
            for video in videos:
                if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                    trailer_url = f"https://www.youtube.com/watch?v={video['key']}"
                    break

            # Extract shots
            images = tmdb_details.get('images', {}).get('backdrops', [])
            shots = [f"https://image.tmdb.org/t/p/w500{img['file_path']}" for img in images[:5]]
            shots = shots if shots else None

            # Extract actors
            credits = tmdb_details.get('credits', {})
            cast = credits.get('cast', [])
            actors = [
                {
                    'name': actor['name'],
                    'character': actor.get('character', ''),
                    'profile_path': f"https://image.tmdb.org/t/p/w500{actor['profile_path']}" if actor.get('profile_path') else None
                }
                for actor in cast[:10]
            ]
            actors = actors if actors else None

            # Update the movie
            movie.trailer_url = trailer_url
            movie.shots = shots
            movie.actors = actors
            movie.save()

            self.stdout.write(self.style.SUCCESS(f'  Updated: {movie.title}'))
            success_count += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Successfully refreshed {success_count} movies'))
        if error_count > 0:
            self.stdout.write(self.style.WARNING(f'Failed to refresh {error_count} movies'))

