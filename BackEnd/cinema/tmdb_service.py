"""
TMDB Service — low-level HTTP integration with The Movie Database (TMDB) API.

Functions:
  - search_movies(query, page)    → search TMDB for movies matching a title
  - get_movie_details(movie_id)   → full details (credits, videos, images)
  - get_popular_movies(page)      → trending / popular movies
"""

import logging

import requests
from tmdbv3api import TMDb, Movie
from django.conf import settings


logger = logging.getLogger(__name__)

TMDB_IMAGES_ENDPOINT_TEMPLATE = "https://api.themoviedb.org/3/movie/{movie_id}/images"


def _normalize_movie_id(movie_id):
    """Return a positive integer TMDB movie id, or None if invalid."""
    try:
        normalized = int(movie_id)
    except (TypeError, ValueError):
        return None
    return normalized if normalized > 0 else None


def search_movies(query, page=1):
    """
    Search TMDB by title.
    Returns the raw API response dict (with 'results' key), or [].
    """
    tmdb = TMDb()
    tmdb.api_key = settings.TMDB_API_KEY
    movie_api = Movie()
    try:
        results = movie_api.search(query, page=page)
        if hasattr(results, '_json'):
            return results._json
        return results
    except Exception as e:
        print(f"Error searching movies: {e}")
        return []


def get_movie_details(movie_id):
    """
    Fetch full details for a movie by TMDB ID.
    Appends videos, images, and credits to the response.
    Filters backdrops to prefer text-free scene shots.
    """
    normalized_movie_id = _normalize_movie_id(movie_id)
    if normalized_movie_id is None:
        logger.warning("Rejected invalid TMDB movie_id: %r", movie_id)
        return None

    tmdb = TMDb()
    tmdb.api_key = settings.TMDB_API_KEY
    movie_api = Movie()
    try:
        details = movie_api.details(normalized_movie_id, append_to_response="videos,images,credits")
        if hasattr(details, '_json'):
            details = details._json

        # Fetch images separately to get text-free backdrops
        try:
            images_url = TMDB_IMAGES_ENDPOINT_TEMPLATE.format(movie_id=normalized_movie_id)
            images_response = requests.get(
                images_url,
                params={'api_key': settings.TMDB_API_KEY},
                timeout=10,
            )
            if images_response.status_code == 200:
                images_data = images_response.json()
                backdrops = images_data.get('backdrops', [])

                # Prefer backdrops without text overlay (iso_639_1 is null)
                scene_shots = [
                    img for img in backdrops
                    if img.get('iso_639_1') is None and img.get('aspect_ratio', 0) > 1.5
                ]
                scene_shots.sort(key=lambda x: x.get('vote_average', 0), reverse=True)

                # Fall back to all backdrops if not enough clean ones
                if len(scene_shots) < 5:
                    scene_shots = sorted(backdrops, key=lambda x: x.get('vote_average', 0), reverse=True)
                details['images'] = {'backdrops': scene_shots}
        except Exception as e:
            logger.warning("Error fetching TMDB images for %s: %s", normalized_movie_id, e)

        return details
    except Exception as e:
        logger.error("Error getting TMDB movie details for %s: %s", normalized_movie_id, e)
        return None


def get_popular_movies(page=1):
    """
    Fetch the current popular movies from TMDB.
    Returns the raw API response dict (with 'results' key), or [].
    """
    tmdb = TMDb()
    tmdb.api_key = settings.TMDB_API_KEY
    movie_api = Movie()
    try:
        results = movie_api.popular(page=page)
        if hasattr(results, '_json'):
            return results._json
        return results
    except Exception as e:
        print(f"Error getting popular movies: {e}")
        return []
