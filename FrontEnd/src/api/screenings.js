/**
 * Screening API calls.
 * Endpoints related to individual screening details.
 */

const API_URL = import.meta.env.VITE_API_URL || "";

/** Fetch a single screening by its ID (includes hall layout, price, etc.). */
export async function getScreening(screeningId) {
    const res = await fetch(`${API_URL}/api/screenings/${screeningId}/`);
    return res.json();
}

/** Fetch all screenings (used to map movies → halls for hall filtering). */
export async function getScreenings() {
    const res = await fetch(`${API_URL}/api/screenings/`);
    return res.json();
}
