/**
 * Screening API calls.
 * Endpoints related to individual screening details.
 */

/** Fetch a single screening by its ID (includes hall layout, price, etc.). */
export async function getScreening(screeningId) {
    const res = await fetch(`http://127.0.0.1:8000/api/screenings/${screeningId}/`);
    return res.json();
}
