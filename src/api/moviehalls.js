/*
Αυτό το αρχείο περιέχει τις λειτουργίες API για τις αίθουσες κινηματογράφου, όπως ανάκτηση, δημιουργία, ενημέρωση και διαγραφή αιθουσών.
*/

const API = "http://127.0.0.1:8000/api/moviehalls/";

export async function getMovieHalls() {
    try {
        const res = await fetch(API);
        if (!res.ok) {
            console.error("Failed to fetch movie halls:", res.status, res.statusText);
            // Log the response text to see the HTML error page from Django
            const errorText = await res.text();
            console.error("Server response:", errorText);
            return []; // Return empty array to prevent crash
        }
        return res.json();
    } catch (error) {
        console.error("Network error fetching movie halls:", error);
        return [];
    }
}

export async function getMovieHall(id) {
    const res = await fetch(`${API}${id}/`);
    return res.json();
}

export async function createMovieHall(data) {
    const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function updateMovieHall(id, data) {
    const res = await fetch(`${API}${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function patchMovieHall(id, data) {
    const res = await fetch(`${API}${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteMovieHall(id) {
    const res = await fetch(`${API}${id}/`, {
        method: "DELETE",
    });
    return res.ok;
}
