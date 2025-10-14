/*
Αυτό το αρχείο περιέχει τις λειτουργίες API για τις ταινίες, όπως ανάκτηση, δημιουργία, ενημέρωση και διαγραφή ταινιών.
*/

const API = "http://127.0.0.1:8000/api/movies/";

export async function getMovies() {
    const res = await fetch(API);
    return res.json(); // returns {count,next,previous,results}
}

export async function getMovie(id) {
    const res = await fetch(`${API}${id}/`);
    return res.json();
}

export async function getMovieScreenings(id) {
    const res = await fetch(`${API}${id}/screenings/`);
    return res.json();
}

export async function createMovie(data) {
    const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function updateMovie(id, data) {
    const res = await fetch(`${API}${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function patchMovie(id, data) {
    const res = await fetch(`${API}${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteMovie(id) {
    const res = await fetch(`${API}${id}/`, {
        method: "DELETE",
    });
    return res.ok; // or handle response
}

export async function searchTMDB(query, page = 1) {
    const res = await fetch(`${API}search_tmdb/?query=${query}&page=${page}`);
    return res.json();
}

export async function getPopularTMDB(page = 1) {
    const res = await fetch(`${API}popular_tmdb/?page=${page}`);
    return res.json();
}

export async function getTMDBDetails(movieId) {
    const res = await fetch(`${API}tmdb_details/?movie_id=${movieId}`);
    return res.json();
}
