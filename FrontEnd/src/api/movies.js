/**
 * Movie API calls.
 * Functions for fetching, creating, updating, and deleting movies.
 * Also includes TMDB search/popular/details proxy endpoints.
 */

const API = `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/api/movies/`;

/** Fetch the paginated list of all movies. Returns { count, next, previous, results }. */
export async function getMovies() {
    const res = await fetch(API);
    return res.json();
}

/** Fetch a single movie by its primary key. */
export async function getMovie(id) {
    const res = await fetch(`${API}${id}/`);
    return res.json();
}

/** Fetch all screenings for a specific movie. */
export async function getMovieScreenings(id) {
    const res = await fetch(`${API}${id}/screenings/`);
    return res.json();
}

/** Create a new movie. */
export async function createMovie(data) {
    const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

/** Fully update an existing movie (PUT). */
export async function updateMovie(id, data) {
    const res = await fetch(`${API}${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

/** Partially update an existing movie (PATCH). */
export async function patchMovie(id, data) {
    const res = await fetch(`${API}${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

/** Delete a movie by its primary key. Returns true on success. */
export async function deleteMovie(id) {
    const res = await fetch(`${API}${id}/`, {
        method: "DELETE",
    });
    return res.ok;
}

/** Search TMDB via the backend proxy. */
export async function searchTMDB(query, page = 1) {
    const res = await fetch(`${API}search_tmdb/?query=${query}&page=${page}`);
    return res.json();
}

/** Fetch popular movies from TMDB via the backend proxy. */
export async function getPopularTMDB(page = 1) {
    const res = await fetch(`${API}popular_tmdb/?page=${page}`);
    return res.json();
}

/** Fetch TMDB movie details via the backend proxy. */
export async function getTMDBDetails(movieId) {
    const res = await fetch(`${API}tmdb_details/?movie_id=${movieId}`);
    return res.json();
}
