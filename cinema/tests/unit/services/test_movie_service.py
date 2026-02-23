"""Unit tests for MovieService business logic."""

import pytest
from decimal import Decimal
from unittest.mock import patch, Mock
from cinema.services.movie_service import MovieService
from cinema.services.errors import ServiceError
from cinema.repositories import MovieRepository


@pytest.mark.django_db
class TestMovieService:
    """Test MovieService business logic."""

    def test_list_movies(self, movie):
        """Test listing movies."""
        repo = MovieRepository()
        service = MovieService(repo=repo)

        movies = service.list_movies()

        assert movies.count() >= 1
        assert movie in movies

    @patch('cinema.services.movie_service.search_movies')
    def test_search_tmdb_api_exception_propagates(self, mock_search):
        """Unhandled exception from TMDB propagates out of search_tmdb (production 500 risk)."""
        mock_search.side_effect = Exception("Connection timeout")

        repo = MovieRepository()
        service = MovieService(repo=repo)

        with pytest.raises(Exception, match="timeout"):
            service.search_tmdb('any query')

    @patch('cinema.services.movie_service.search_movies')
    def test_search_tmdb_success(self, mock_search):
        """Test TMDB search with valid query."""
        mock_search.return_value = {'results': [{'id': 123, 'title': 'Test'}]}

        repo = MovieRepository()
        service = MovieService(repo=repo)

        result = service.search_tmdb('test query', page=1)

        assert result == {'results': [{'id': 123, 'title': 'Test'}]}
        mock_search.assert_called_once_with('test query', 1)

    def test_search_tmdb_empty_query(self):
        """Test TMDB search with empty query raises error."""
        repo = MovieRepository()
        service = MovieService(repo=repo)

        with pytest.raises(ServiceError) as exc_info:
            service.search_tmdb('')

        assert exc_info.value.message == 'Query parameter is required'
        assert exc_info.value.status_code == 400

    @patch('cinema.services.movie_service.get_popular_movies')
    def test_popular_tmdb(self, mock_popular):
        """Test fetching popular movies from TMDB."""
        mock_popular.return_value = {'results': [{'id': 456, 'title': 'Popular'}]}

        repo = MovieRepository()
        service = MovieService(repo=repo)

        result = service.popular_tmdb(page=2)

        assert result == {'results': [{'id': 456, 'title': 'Popular'}]}
        mock_popular.assert_called_once_with(2)

    @patch('cinema.services.movie_service.get_movie_details')
    def test_tmdb_details_success(self, mock_details):
        """Test fetching TMDB movie details."""
        mock_details.return_value = {'id': 123, 'title': 'Movie'}

        repo = MovieRepository()
        service = MovieService(repo=repo)

        result = service.tmdb_details(123)

        assert result == {'id': 123, 'title': 'Movie'}
        mock_details.assert_called_once_with(123)

    @patch('cinema.services.movie_service.get_movie_details')
    def test_tmdb_details_not_found(self, mock_details):
        """Test TMDB details when movie not found."""
        mock_details.return_value = None

        repo = MovieRepository()
        service = MovieService(repo=repo)

        with pytest.raises(ServiceError) as exc_info:
            service.tmdb_details(999)

        assert exc_info.value.message == 'Movie not found'
        assert exc_info.value.status_code == 404

    @patch('cinema.services.movie_service.get_movie_details')
    def test_build_movie_data_from_tmdb_id_complete(self, mock_details):
        """Test building movie data from TMDB with complete details."""
        mock_details.return_value = {
            'title': 'Complete Movie',
            'overview': 'A great description',
            'runtime': 150,
            'genres': [{'name': 'Action'}, {'name': 'Drama'}],
            'release_date': '2024-05-15',
            'vote_average': 8.7,
            'poster_path': '/poster.jpg',
            'videos': {
                'results': [
                    {'type': 'Trailer', 'site': 'YouTube', 'key': 'abc123'},
                    {'type': 'Teaser', 'site': 'YouTube', 'key': 'xyz789'},
                ]
            },
            'images': {
                'backdrops': [
                    {'file_path': '/shot1.jpg'},
                    {'file_path': '/shot2.jpg'},
                    {'file_path': '/shot3.jpg'},
                ]
            },
            'credits': {
                'crew': [
                    {'job': 'Director', 'name': 'John Director'},
                    {'job': 'Producer', 'name': 'Jane Producer'},
                ],
                'cast': [
                    {'name': 'Actor One', 'character': 'Hero', 'profile_path': '/actor1.jpg'},
                    {'name': 'Actor Two', 'character': 'Villain', 'profile_path': None},
                ]
            }
        }

        repo = MovieRepository()
        service = MovieService(repo=repo)

        result = service.build_movie_data_from_tmdb_id(12345)

        assert result['title'] == 'Complete Movie'
        assert result['description'] == 'A great description'
        assert result['duration'] == 150
        assert result['genre'] == 'Action, Drama'
        assert result['director'] == 'John Director'
        assert result['release_year'] == 2024
        assert result['rating'] == Decimal('8.7')
        assert result['poster_url'] == 'https://image.tmdb.org/t/p/w500/poster.jpg'
        assert result['trailer_url'] == 'https://www.youtube.com/watch?v=abc123'
        assert len(result['shots']) == 3
        assert len(result['actors']) == 2
        assert result['actors'][0]['name'] == 'Actor One'

    @patch('cinema.services.movie_service.get_movie_details')
    def test_build_movie_data_no_trailer(self, mock_details):
        """Test building movie data when no trailer is available."""
        mock_details.return_value = {
            'title': 'No Trailer Movie',
            'overview': 'Description',
            'runtime': 100,
            'genres': [{'name': 'Comedy'}],
            'release_date': '2023-01-01',
            'vote_average': 7.0,
            'poster_path': None,
            'videos': {'results': []},
            'images': {'backdrops': []},
            'credits': {'crew': [], 'cast': []}
        }

        repo = MovieRepository()
        service = MovieService(repo=repo)

        result = service.build_movie_data_from_tmdb_id(999)

        assert result['trailer_url'] is None
        assert result['shots'] is None
        assert result['actors'] is None
        assert result['poster_url'] is None

    @patch('cinema.services.movie_service.get_movie_details')
    def test_build_movie_data_missing_release_date(self, mock_details):
        """Test building movie data with missing release date."""
        mock_details.return_value = {
            'title': 'No Release Date',
            'overview': 'Desc',
            'runtime': 90,
            'genres': [{'name': 'Horror'}],
            'release_date': None,
            'vote_average': 6.5,
            'credits': {'crew': []}
        }

        repo = MovieRepository()
        service = MovieService(repo=repo)

        result = service.build_movie_data_from_tmdb_id(888)

        assert result['release_year'] == 0

    @patch('cinema.services.movie_service.get_movie_details')
    def test_build_movie_data_not_found(self, mock_details):
        """Test building movie data when TMDB returns None."""
        mock_details.return_value = None

        repo = MovieRepository()
        service = MovieService(repo=repo)

        with pytest.raises(ServiceError) as exc_info:
            service.build_movie_data_from_tmdb_id(999)

        assert exc_info.value.message == 'Movie not found in TMDB'
        assert exc_info.value.status_code == 404

    @patch('cinema.services.movie_service.get_movie_details')
    def test_build_movie_data_no_title(self, mock_details):
        """Test validation error when title is missing."""
        mock_details.return_value = {
            'title': '',
            'overview': 'Desc',
            'runtime': 100,
            'genres': [{'name': 'Action'}],
            'release_date': '2023-01-01',
            'vote_average': 7.0,
            'credits': {'crew': []}
        }

        repo = MovieRepository()
        service = MovieService(repo=repo)

        with pytest.raises(ServiceError) as exc_info:
            service.build_movie_data_from_tmdb_id(123)

        assert exc_info.value.message == 'Movie title is required'
        assert exc_info.value.status_code == 400

    @patch('cinema.services.movie_service.get_movie_details')
    def test_build_movie_data_invalid_duration(self, mock_details):
        """Test validation error when duration is zero or negative."""
        mock_details.return_value = {
            'title': 'Invalid Duration',
            'overview': 'Desc',
            'runtime': 0,
            'genres': [{'name': 'Action'}],
            'release_date': '2023-01-01',
            'vote_average': 7.0,
            'credits': {'crew': []}
        }

        repo = MovieRepository()
        service = MovieService(repo=repo)

        with pytest.raises(ServiceError) as exc_info:
            service.build_movie_data_from_tmdb_id(123)

        assert exc_info.value.message == 'Movie duration must be greater than 0'
        assert exc_info.value.status_code == 400

    @patch('cinema.services.movie_service.get_movie_details')
    def test_build_movie_data_default_values(self, mock_details):
        """Test default values when genre/director are missing."""
        mock_details.return_value = {
            'title': 'Minimal Movie',
            'overview': 'Desc',
            'runtime': 90,
            'genres': [],
            'release_date': '2023-01-01',
            'vote_average': 7.0,
            'credits': {'crew': []}
        }

        repo = MovieRepository()
        service = MovieService(repo=repo)

        result = service.build_movie_data_from_tmdb_id(123)

        assert result['genre'] == 'Unknown'
        assert result['director'] == 'Unknown'

    @patch('cinema.services.movie_service.get_movie_details')
    def test_build_movie_data_empty_genre_string(self, mock_details):
        """Test that empty genre gets replaced with Unknown."""
        mock_details.return_value = {
            'title': 'No Genre Movie',
            'overview': 'Desc',
            'runtime': 90,
            'genres': [],
            'release_date': '2023-01-01',
            'vote_average': 7.0,
            'credits': {'crew': [{'job': 'Director', 'name': 'John'}]}
        }

        repo = MovieRepository()
        service = MovieService(repo=repo)

        result = service.build_movie_data_from_tmdb_id(123)

        # Should be set to Unknown when genres is empty
        assert result['genre'] == 'Unknown'
        assert result['director'] == 'John'

    @patch('cinema.services.movie_service.get_movie_details')
    @patch('cinema.services.movie_service.search_movies')
    def test_refresh_movie_from_tmdb_success(self, mock_search, mock_details):
        """Test refreshing movie data from TMDB."""
        mock_search.return_value = {
            'results': [{'id': 456, 'title': 'Refresh Movie'}]
        }
        mock_details.return_value = {
            'videos': {
                'results': [
                    {'type': 'Trailer', 'site': 'YouTube', 'key': 'new123'},
                ]
            },
            'images': {
                'backdrops': [
                    {'file_path': '/newshot1.jpg'},
                    {'file_path': '/newshot2.jpg'},
                ]
            },
            'credits': {
                'cast': [
                    {'name': 'New Actor', 'character': 'Lead', 'profile_path': '/new.jpg'},
                ]
            }
        }

        repo = MovieRepository()
        service = MovieService(repo=repo)

        result = service.refresh_movie_from_tmdb('Refresh Movie')

        assert result['trailer_url'] == 'https://www.youtube.com/watch?v=new123'
        assert len(result['shots']) == 2
        assert len(result['actors']) == 1
        assert result['actors'][0]['name'] == 'New Actor'

    @patch('cinema.services.movie_service.search_movies')
    def test_refresh_movie_from_tmdb_not_found(self, mock_search):
        """Test refresh when movie not found on TMDB."""
        mock_search.return_value = {'results': []}

        repo = MovieRepository()
        service = MovieService(repo=repo)

        with pytest.raises(ServiceError) as exc_info:
            service.refresh_movie_from_tmdb('NonExistent Movie')

        assert exc_info.value.message == 'Movie not found on TMDB'
        assert exc_info.value.status_code == 404

    @patch('cinema.services.movie_service.search_movies')
    def test_refresh_movie_from_tmdb_empty_results(self, mock_search):
        """Test refresh when search returns no results key."""
        mock_search.return_value = None

        repo = MovieRepository()
        service = MovieService(repo=repo)

        with pytest.raises(ServiceError) as exc_info:
            service.refresh_movie_from_tmdb('Movie')

        assert exc_info.value.status_code == 404

    @patch('cinema.services.movie_service.get_movie_details')
    @patch('cinema.services.movie_service.search_movies')
    def test_refresh_movie_details_fetch_fails(self, mock_search, mock_details):
        """Test refresh when details fetch fails."""
        mock_search.return_value = {
            'results': [{'id': 456, 'title': 'Movie'}]
        }
        mock_details.return_value = None

        repo = MovieRepository()
        service = MovieService(repo=repo)

        with pytest.raises(ServiceError) as exc_info:
            service.refresh_movie_from_tmdb('Movie')

        assert exc_info.value.message == 'Could not fetch TMDB details'
        assert exc_info.value.status_code == 404

    def test_get_director_from_credits_found(self):
        """Test extracting director from credits."""
        credits = {
            'crew': [
                {'job': 'Producer', 'name': 'Jane Doe'},
                {'job': 'Director', 'name': 'John Director'},
                {'job': 'Writer', 'name': 'Bob Writer'},
            ]
        }

        director = MovieService._get_director_from_credits(credits)

        assert director == 'John Director'

    def test_get_director_from_credits_not_found(self):
        """Test director extraction when no director in credits."""
        credits = {
            'crew': [
                {'job': 'Producer', 'name': 'Jane Doe'},
                {'job': 'Writer', 'name': 'Bob Writer'},
            ]
        }

        director = MovieService._get_director_from_credits(credits)

        assert director == 'Unknown'

    def test_get_director_from_credits_empty(self):
        """Test director extraction with empty credits."""
        director = MovieService._get_director_from_credits({})
        assert director == 'Unknown'

        director = MovieService._get_director_from_credits(None)
        assert director == 'Unknown'

