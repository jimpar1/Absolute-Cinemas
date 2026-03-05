"""
TMDB Service — low-level HTTP integration with The Movie Database (TMDB) API.

Functions:
  - search_movies(query, page)    → search TMDB for movies matching a title
  - get_movie_details(movie_id)   → full details (credits, videos, images)
  - get_popular_movies(page)      → trending / popular movies
"""

from tmdbv3api import TMDb, Movie
from django.conf import settings


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
    import requests
    tmdb = TMDb()
    tmdb.api_key = settings.TMDB_API_KEY
    movie_api = Movie()
    try:
        details = movie_api.details(movie_id, append_to_response="videos,images,credits")
        if hasattr(details, '_json'):
            details = details._json

        # Fetch images separately to get text-free backdrops
        try:
            images_url = f"https://api.themoviedb.org/3/movie/{movie_id}/images?api_key={settings.TMDB_API_KEY}"
            images_response = requests.get(images_url)
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
            print(f"Error fetching images: {e}")

        return details
    except Exception as e:
        print(f"Error getting movie details: {e}")
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
