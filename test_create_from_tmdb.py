import requests
import json

# Test the TMDB movie creation functionality
BASE_URL = 'http://127.0.0.1:8000/api'

def test_tmdb_creation():
    # Test creating a movie from TMDB (Inception - TMDB ID: 27205)
    url = f'{BASE_URL}/movies/create_from_tmdb/'
    data = {'tmdb_id': 27205}

    try:
        response = requests.post(url, json=data)
        print(f'Status Code: {response.status_code}')
        print(f'Response: {response.json()}')
    except Exception as e:
        print(f'Error: {e}')

def test_create_from_search():
    # Test creating a movie from TMDB search query
    url = f'{BASE_URL}/movies/create_from_search/'
    data = {'query': 'Inception'}

    try:
        response = requests.post(url, json=data)
        print(f'Status Code: {response.status_code}')
        print(f'Response: {response.json()}')
    except Exception as e:
        print(f'Error: {e}')

def test_manual_creation_disabled():
    # Test that manual movie creation is disabled
    url = f'{BASE_URL}/movies/'
    data = {
        'title': 'Test Movie',
        'description': 'A test movie',
        'duration': 120,
        'genre': 'Drama',
        'director': 'Test Director',
        'release_year': 2023,
        'rating': 7.5
    }

    try:
        response = requests.post(url, json=data)
        print(f'Status Code: {response.status_code}')
        print(f'Response: {response.json()}')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    test_tmdb_creation()
    test_create_from_search()
    test_manual_creation_disabled()
