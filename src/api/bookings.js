/*
Αυτό το αρχείο περιέχει τις λειτουργίες API για τις κρατήσεις, όπως ανάκτηση, δημιουργία, ενημέρωση και διαγραφή κρατήσεων.
*/

const API = "http://127.0.0.1:8000/api/bookings/";

export async function getBookings() {
    const res = await fetch(API);
    return res.json();
}

export async function getBooking(id) {
    const res = await fetch(`${API}${id}/`);
    return res.json();
}

export async function createBooking(data) {
    try {
        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Failed to create booking:", res.status, res.statusText, errorText);
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }

        return res.json();
    } catch (error) {
        console.error("Error in createBooking:", error);
        throw error; // Re-throw the error to be caught by the component
    }
}

export async function updateBooking(id, data) {
    const res = await fetch(`${API}${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function patchBooking(id, data) {
    const res = await fetch(`${API}${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function deleteBooking(id) {
    const res = await fetch(`${API}${id}/`, {
        method: "DELETE",
    });
    return res.ok;
}
