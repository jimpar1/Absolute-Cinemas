from tmdbv3api import TMDb, Movie

tmdb = TMDb()
tmdb.api_key = '18324c6e6eb5ceed0ea8c49c26fcf8b8'
tmdb.language = 'en'
tmdb.debug = True

movie = Movie()

try:
    results = movie.popular(page=1)
    print("Popular movies:", results)
except Exception as e:
    print("Error:", e)
