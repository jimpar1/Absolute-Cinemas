/*
Αυτό το αρχείο περιέχει τις λειτουργίες API για τις προβολές, όπως ανάκτηση, δημιουργία, ενημέρωση και διαγραφή προβολών.
*/

const API = "http://127.0.0.1:8000/api/screenings/";

export async function getScreenings() {
    try {
        const res = await fetch(API);
        if (!res.ok) {
            console.error("Failed to fetch screenings:", res.status, res.statusText);
            // Log the response text to see the HTML error page from Django
            const errorText = await res.text();
            console.error("Server response:", errorText);
            return []; // Return empty array to prevent crash
        }
        return res.json();
    } catch (error) {
        console.error("Network error fetching screenings:", error);
        return [];
    }
}

export async function getScreening(id) {
    const res = await fetch(`${API}${id}/`);
    return res.json();
}

export async function createScreening(data) {
    const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function updateScreening(id, data) {
    const res = await fetch(`${API}${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function patchScreening(id, data) {
    const res = await fetch(`${API}${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteScreening(id) {
    const res = await fetch(`${API}${id}/`, {
        method: "DELETE",
    });
    return res.ok;
}

export async function getScreeningBookings(id) {
    const res = await fetch(`${API}${id}/bookings/`);
    return res.json();
}
