"""
TMDB Service - Εξυπηρέτηση για το TMDB API
TMDB Service - Service for TMDB API

Παρέχει λειτουργίες για την ανάκτηση δεδομένων από το TMDB API.
Provides functions to retrieve data from TMDB API.
"""

from tmdbv3api import TMDb, Movie
from django.conf import settings


def search_movies(query, page=1):
    """
    Αναζήτηση ταινιών στο TMDB
    Search movies on TMDB

    :param query: Το ερώτημα αναζήτησης
    :param page: Η σελίδα αποτελεσμάτων
    :return: Λίστα ταινιών από TMDB
    """
    tmdb = TMDb()
    tmdb.api_key = settings.TMDB_API_KEY
    movie_api = Movie()
    try:
        results = movie_api.search(query, page=page)
        # Convert to dict if it has _json attribute
        if hasattr(results, '_json'):
            return results._json
        return results
    except Exception as e:
        print(f"Error searching movies: {e}")
        return []


def get_movie_details(movie_id):
    """
    Λήψη λεπτομερών πληροφοριών για μια ταινία
    Get detailed information for a movie

    :param movie_id: Το ID της ταινίας στο TMDB
    :return: Λεπτομέρειες ταινίας
    """
    import requests
    tmdb = TMDb()
    tmdb.api_key = settings.TMDB_API_KEY
    movie_api = Movie()
    try:
        details = movie_api.details(movie_id, append_to_response="videos,images,credits")
        # Convert to dict if it has _json attribute
        if hasattr(details, '_json'):
            details = details._json

        # Fetch movie stills from the images endpoint with include_image_language for better shots
        # Use the direct API to get images without language filter (more scene shots)
        try:
            images_url = f"https://api.themoviedb.org/3/movie/{movie_id}/images?api_key={settings.TMDB_API_KEY}"
            images_response = requests.get(images_url)
            if images_response.status_code == 200:
                images_data = images_response.json()
                # Get backdrops without text (iso_639_1 is null = no text overlay)
                backdrops = images_data.get('backdrops', [])
                # Filter backdrops: prefer ones without language (no text) and good aspect ratio
                # Sort by vote_average to get best quality shots first
                scene_shots = [
                    img for img in backdrops
                    if img.get('iso_639_1') is None and img.get('aspect_ratio', 0) > 1.5
                ]
                # Sort by vote_average (best rated images first)
                scene_shots.sort(key=lambda x: x.get('vote_average', 0), reverse=True)
                # If not enough, add all backdrops
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
    Λήψη δημοφιλών ταινιών
    Get popular movies

    :param page: Η σελίδα αποτελεσμάτων
    :return: Λίστα δημοφιλών ταινιών
    """
    tmdb = TMDb()
    tmdb.api_key = settings.TMDB_API_KEY
    movie_api = Movie()
    try:
        results = movie_api.popular(page=page)
        # Convert to dict if it has _json attribute
        if hasattr(results, '_json'):
            return results._json
        return results
    except Exception as e:
        print(f"Error getting popular movies: {e}")
        return []
