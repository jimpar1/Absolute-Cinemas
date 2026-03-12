"""Tests for refresh_movies_from_tmdb management command."""

import pytest
from io import StringIO
from unittest.mock import patch, MagicMock
from django.core.management import call_command
from cinema.models import Movie


@pytest.mark.django_db
class TestRefreshMoviesFromTMDBCommand:
    """Tests for the refresh_movies_from_tmdb command."""

    @patch('cinema.management.commands.refresh_movies_from_tmdb.get_movie_details')
    @patch('cinema.management.commands.refresh_movies_from_tmdb.search_movies')
    def test_command_refreshes_all_movies(self, mock_search, mock_details, make_movie):
        """Test command refreshes all movies when run without flags."""
        # Create test movies
        movie1 = make_movie(title="Movie 1", trailer_url=None, shots=None, actors=None)
        movie2 = make_movie(title="Movie 2", trailer_url=None, shots=None, actors=None)

        # Mock TMDB responses
        mock_search.return_value = {
            'results': [{'id': 12345}]
        }
        mock_details.return_value = {
            'videos': {
                'results': [{'type': 'Trailer', 'site': 'YouTube', 'key': 'abc123'}]
            },
            'images': {
                'backdrops': [
                    {'file_path': '/backdrop1.jpg'},
                    {'file_path': '/backdrop2.jpg'}
                ]
            },
            'credits': {
                'cast': [
                    {'name': 'Actor 1', 'character': 'Hero', 'profile_path': '/actor1.jpg'},
                    {'name': 'Actor 2', 'character': 'Villain', 'profile_path': '/actor2.jpg'}
                ]
            }
        }

        # Run command
        call_command('refresh_movies_from_tmdb')

        # Verify movies were updated
        movie1.refresh_from_db()
        movie2.refresh_from_db()

        assert movie1.trailer_url is not None
        assert 'youtube.com' in movie1.trailer_url
        assert movie1.shots is not None
        assert len(movie1.shots) > 0
        assert movie1.actors is not None
        assert len(movie1.actors) > 0

    @patch('cinema.management.commands.refresh_movies_from_tmdb.get_movie_details')
    @patch('cinema.management.commands.refresh_movies_from_tmdb.search_movies')
    def test_command_with_only_missing_flag(self, mock_search, mock_details, make_movie):
        """Test command with --only-missing refreshes only movies with missing data."""
        # Create movies - one with data, one without
        movie_complete = make_movie(
            title="Complete Movie",
            trailer_url="https://youtube.com/watch?v=xyz",
            shots=["https://image.url/shot1.jpg"],
            actors=[{"name": "Actor", "character": "Role"}]
        )
        movie_missing = make_movie(
            title="Missing Movie",
            trailer_url=None,
            shots=None,
            actors=None
        )

        mock_search.return_value = {'results': [{'id': 12345}]}
        mock_details.return_value = {
            'videos': {'results': [{'type': 'Trailer', 'site': 'YouTube', 'key': 'newkey'}]},
            'images': {'backdrops': [{'file_path': '/new.jpg'}]},
            'credits': {'cast': [{'name': 'New Actor', 'character': 'Role', 'profile_path': '/new.jpg'}]}
        }

        # Run with --only-missing
        call_command('refresh_movies_from_tmdb', '--only-missing')

        # Complete movie should be unchanged
        movie_complete.refresh_from_db()
        assert movie_complete.trailer_url == "https://youtube.com/watch?v=xyz"

        # Missing movie should be updated
        movie_missing.refresh_from_db()
        assert movie_missing.trailer_url is not None

    @patch('cinema.management.commands.refresh_movies_from_tmdb.get_movie_details')
    @patch('cinema.management.commands.refresh_movies_from_tmdb.search_movies')
    def test_command_handles_movie_not_found_on_tmdb(self, mock_search, mock_details, make_movie):
        """Test command handles movies not found on TMDB gracefully."""
        movie = make_movie(title="Nonexistent Movie")

        # Mock TMDB returning no results
        mock_search.return_value = {'results': []}

        out = StringIO()
        call_command('refresh_movies_from_tmdb', stdout=out)

        output = out.getvalue()
        assert 'Not found on TMDB' in output or 'Failed to refresh' in output

    @patch('cinema.management.commands.refresh_movies_from_tmdb.get_movie_details')
    @patch('cinema.management.commands.refresh_movies_from_tmdb.search_movies')
    def test_command_handles_tmdb_details_fetch_failure(self, mock_search, mock_details, make_movie):
        """Test command handles TMDB details fetch failure."""
        _movie = make_movie(title="Test Movie")

        mock_search.return_value = {'results': [{'id': 12345}]}
        mock_details.return_value = None  # Simulates fetch failure

        out = StringIO()
        call_command('refresh_movies_from_tmdb', stdout=out)

        output = out.getvalue()
        assert 'Could not fetch details' in output or 'Failed to refresh' in output

    @patch('cinema.management.commands.refresh_movies_from_tmdb.get_movie_details')
    @patch('cinema.management.commands.refresh_movies_from_tmdb.search_movies')
    def test_command_extracts_trailer_url_correctly(self, mock_search, mock_details, make_movie):
        """Test command extracts YouTube trailer URL correctly."""
        movie = make_movie(title="Test Movie")

        mock_search.return_value = {'results': [{'id': 12345}]}
        mock_details.return_value = {
            'videos': {
                'results': [
                    {'type': 'Teaser', 'site': 'YouTube', 'key': 'teaser123'},  # Skip teaser
                    {'type': 'Trailer', 'site': 'YouTube', 'key': 'trailer456'},  # Use this
                ]
            },
            'images': {'backdrops': []},
            'credits': {'cast': []}
        }

        call_command('refresh_movies_from_tmdb')

        movie.refresh_from_db()
        assert movie.trailer_url == "https://www.youtube.com/watch?v=trailer456"

    @patch('cinema.management.commands.refresh_movies_from_tmdb.get_movie_details')
    @patch('cinema.management.commands.refresh_movies_from_tmdb.search_movies')
    def test_command_extracts_shots_correctly(self, mock_search, mock_details, make_movie):
        """Test command extracts backdrop shots correctly (max 5)."""
        movie = make_movie(title="Test Movie")

        mock_search.return_value = {'results': [{'id': 12345}]}
        mock_details.return_value = {
            'videos': {'results': []},
            'images': {
                'backdrops': [
                    {'file_path': '/shot1.jpg'},
                    {'file_path': '/shot2.jpg'},
                    {'file_path': '/shot3.jpg'},
                    {'file_path': '/shot4.jpg'},
                    {'file_path': '/shot5.jpg'},
                    {'file_path': '/shot6.jpg'},  # This should be ignored (max 5)
                ]
            },
            'credits': {'cast': []}
        }

        call_command('refresh_movies_from_tmdb')

        movie.refresh_from_db()
        assert len(movie.shots) == 5
        assert 'w500/shot1.jpg' in movie.shots[0]

    @patch('cinema.management.commands.refresh_movies_from_tmdb.get_movie_details')
    @patch('cinema.management.commands.refresh_movies_from_tmdb.search_movies')
    def test_command_extracts_actors_correctly(self, mock_search, mock_details, make_movie):
        """Test command extracts cast actors correctly (max 10)."""
        movie = make_movie(title="Test Movie")

        cast_list = [{'name': f'Actor {i}', 'character': f'Role {i}', 'profile_path': f'/actor{i}.jpg'} for i in range(15)]

        mock_search.return_value = {'results': [{'id': 12345}]}
        mock_details.return_value = {
            'videos': {'results': []},
            'images': {'backdrops': []},
            'credits': {'cast': cast_list}
        }

        call_command('refresh_movies_from_tmdb')

        movie.refresh_from_db()
        assert len(movie.actors) == 10  # Max 10 actors
        assert movie.actors[0]['name'] == 'Actor 0'
        assert 'w500/actor0.jpg' in movie.actors[0]['profile_path']

    @patch('cinema.management.commands.refresh_movies_from_tmdb.get_movie_details')
    @patch('cinema.management.commands.refresh_movies_from_tmdb.search_movies')
    def test_command_shows_success_count(self, mock_search, mock_details, make_movie):
        """Test command shows success count in output."""
        make_movie(title="Movie 1")
        make_movie(title="Movie 2")

        mock_search.return_value = {'results': [{'id': 12345}]}
        mock_details.return_value = {
            'videos': {'results': []},
            'images': {'backdrops': []},
            'credits': {'cast': []}
        }

        out = StringIO()
        call_command('refresh_movies_from_tmdb', stdout=out)

        output = out.getvalue()
        assert 'Successfully refreshed 2 movies' in output

    @patch('cinema.management.commands.refresh_movies_from_tmdb.get_movie_details')
    @patch('cinema.management.commands.refresh_movies_from_tmdb.search_movies')
    def test_command_shows_error_count(self, mock_search, mock_details, make_movie):
        """Test command shows error count when some movies fail."""
        make_movie(title="Success Movie")
        make_movie(title="Fail Movie")

        def search_side_effect(title, page):
            if "Fail" in title:
                return {'results': []}  # Not found
            return {'results': [{'id': 12345}]}

        mock_search.side_effect = search_side_effect
        mock_details.return_value = {
            'videos': {'results': []},
            'images': {'backdrops': []},
            'credits': {'cast': []}
        }

        out = StringIO()
        call_command('refresh_movies_from_tmdb', stdout=out)

        output = out.getvalue()
        assert 'Successfully refreshed 1' in output
        assert 'Failed to refresh 1' in output

    @patch('cinema.management.commands.refresh_movies_from_tmdb.get_movie_details')
    @patch('cinema.management.commands.refresh_movies_from_tmdb.search_movies')
    def test_command_handles_no_movies(self, mock_search, mock_details):
        """Test command handles empty database gracefully."""
        # No movies in database

        out = StringIO()
        call_command('refresh_movies_from_tmdb', stdout=out)

        output = out.getvalue()
        assert 'Found 0 movies' in output or 'Successfully refreshed 0' in output
