"""
MovieService — movie listing and TMDB integration.
Handles search, popular, details, building movie data from TMDB,
and refreshing existing movies with TMDB data.
"""

from __future__ import annotations
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict

from ..repositories import MovieRepository
from ..tmdb_service import get_movie_details, get_popular_movies, search_movies
from .errors import ServiceError


@dataclass(frozen=True)
class MovieService:
    """Business logic for movies and TMDB proxy operations."""
    repo: MovieRepository

    def list_movies(self):
        """Return all movies in the catalogue."""
        return self.repo.list()

    # ── TMDB proxy methods ──

    def search_tmdb(self, query: str, page: int = 1):
        """Search TMDB by title. Raises ServiceError if query is empty."""
        if not query:
            raise ServiceError('Query parameter is required', status_code=400)
        return search_movies(query, page)

    def popular_tmdb(self, page: int = 1):
        """Return popular movies from TMDB."""
        return get_popular_movies(page)

    def tmdb_details(self, movie_id: int):
        """Fetch detailed TMDB info by movie ID."""
        details = get_movie_details(int(movie_id))
        if not details:
            raise ServiceError('Movie not found', status_code=404)
        return details

    # ── Movie construction from TMDB ──

    def build_movie_data_from_tmdb_id(self, tmdb_id: int) -> Dict[str, Any]:
        """
        Fetch full TMDB details and return a dict ready for MovieSerializer.
        Includes poster, trailer, shots, and cast.
        """
        movie_details = get_movie_details(tmdb_id)
        if not movie_details:
            raise ServiceError('Movie not found in TMDB', status_code=404)

        release_date = movie_details.get('release_date')
        release_year = int(release_date[:4]) if release_date else 0

        movie_data: Dict[str, Any] = {
            'title': movie_details.get('title', ''),
            'description': movie_details.get('overview', ''),
            'duration': movie_details.get('runtime', 0),
            'genre': ', '.join([g['name'] for g in movie_details.get('genres', [])]),
            'director': self._get_director_from_credits(movie_details.get('credits', {})),
            'release_year': release_year,
            'rating': Decimal(str(round(movie_details.get('vote_average', 0), 1))),
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
        cast = movie_details.get('credits', {}).get('cast', [])
        actors = [
            {
                'name': actor['name'],
                'character': actor.get('character', ''),
                'profile_path': f"https://image.tmdb.org/t/p/w500{actor['profile_path']}" if actor.get('profile_path') else None,
            }
            for actor in cast[:10]
        ]
        movie_data['actors'] = actors if actors else None

        # Validation
        if not movie_data['title']:
            raise ServiceError('Movie title is required', status_code=400)
        if movie_data['duration'] <= 0:
            raise ServiceError('Movie duration must be greater than 0', status_code=400)
        if not movie_data['genre']:
            movie_data['genre'] = 'Unknown'
        if not movie_data['director']:
            movie_data['director'] = 'Unknown'

        return movie_data

    def refresh_movie_from_tmdb(self, movie_title: str) -> Dict[str, Any]:
        """
        Search TMDB by title, take the first result, and return
        a dict of {trailer_url, shots, actors} for updating.
        """
        search_results = search_movies(movie_title, page=1)
        if not search_results or 'results' not in search_results or not search_results['results']:
            raise ServiceError('Movie not found on TMDB', status_code=404)

        tmdb_id = search_results['results'][0]['id']
        tmdb_details = get_movie_details(tmdb_id)
        if not tmdb_details:
            raise ServiceError('Could not fetch TMDB details', status_code=404)

        videos = tmdb_details.get('videos', {}).get('results', [])
        trailer_url = None
        for video in videos:
            if video.get('type') == 'Trailer' and video.get('site') == 'YouTube':
                trailer_url = f"https://www.youtube.com/watch?v={video['key']}"
                break

        images = tmdb_details.get('images', {}).get('backdrops', [])
        shots = [f"https://image.tmdb.org/t/p/original{img['file_path']}" for img in images[:5]]

        cast = tmdb_details.get('credits', {}).get('cast', [])
        actors = [
            {
                'name': actor['name'],
                'character': actor.get('character', ''),
                'profile_path': f"https://image.tmdb.org/t/p/w500{actor['profile_path']}" if actor.get('profile_path') else None,
            }
            for actor in cast[:10]
        ]

        return {
            'trailer_url': trailer_url,
            'shots': shots if shots else None,
            'actors': actors if actors else None,
        }

    # ── Private helpers ──

    @staticmethod
    def _get_director_from_credits(credits: Dict[str, Any]) -> str:
        """Extract the director's name from TMDB credits."""
        crew = (credits or {}).get('crew')
        if not crew:
            return 'Unknown'
        for member in crew:
            if member.get('job') == 'Director':
                return member.get('name', 'Unknown')
        return 'Unknown'
