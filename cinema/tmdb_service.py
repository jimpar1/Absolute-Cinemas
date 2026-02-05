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
    tmdb = TMDb()
    tmdb.api_key = settings.TMDB_API_KEY
    movie_api = Movie()
    try:
        details = movie_api.details(movie_id, append_to_response="credits")
        # Convert to dict if it has _json attribute
        if hasattr(details, '_json'):
            return details._json
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
