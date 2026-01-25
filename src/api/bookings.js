/**
 * Booking API calls.
 * Endpoints for creating bookings, fetching booked seats,
 * and locking/unlocking seats in real-time.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * Create a new booking for a screening.
 * Throws on failure so the caller can show an error message.
 */
export async function createBooking(bookingData, accessToken) {
    const headers = { "Content-Type": "application/json" };
    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${API_URL}/api/bookings/`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(bookingData),
    });
    const data = await res.json();
    if (!res.ok) {
        console.error("Booking API error:", { status: res.status, data });
        throw new Error(data.detail || data.error || JSON.stringify(data) || "Booking failed");
    }
    return data;
}

/**
 * Fetch all booked seat numbers for a screening.
 * Handles both array and paginated responses, and flattens
 * the comma-separated seat_numbers strings into a flat list.
 * @returns {string[]} e.g. ["A1", "A2", "B5"]
 */
export async function getScreeningBookings(screeningId) {
    const res = await fetch(`${API_URL}/api/screenings/${screeningId}/bookings/`);
    const data = await res.json();

    const bookedSeats = [];
    const bookings = Array.isArray(data) ? data : (data.results || []);

    bookings.forEach(booking => {
        if (booking.seat_numbers) {
            const seats = booking.seat_numbers.split(',').map(s => s.trim());
            bookedSeats.push(...seats);
        }
    });

    return bookedSeats;
}

/**
 * Fetch bookings for the current user.
 */
export async function getUserBookings(accessToken) {
    const res = await fetch(`${API_URL}/api/bookings/`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        }
    });
    if (!res.ok) {
        throw new Error("Failed to fetch user bookings");
    }
    return res.json();
}

/**
 * Lock seats so no other session can select them.
 * Throws if the server rejects the lock (seat already taken).
 */
export async function lockSeats(screeningId, seatNumbers, sessionId) {
    const res = await fetch(`${API_URL}/api/screenings/${screeningId}/lock_seats/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seat_numbers: seatNumbers, session_id: sessionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to lock seats");
    return data;
}

/**
 * Unlock previously locked seats for the given session.
 */
export async function unlockSeats(screeningId, seatNumbers, sessionId) {
    const res = await fetch(`${API_URL}/api/screenings/${screeningId}/unlock_seats/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seat_numbers: seatNumbers, session_id: sessionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to unlock seats");
    return data;
}

/**
 * Fetch the current lock map for a screening.
 * @returns {Object.<string, string>} e.g. { "A1": "session-uuid", "A2": "session-uuid" }
 */
export async function getLockedSeats(screeningId) {
    const res = await fetch(`${API_URL}/api/screenings/${screeningId}/locked_seats/`);
    return res.json();
}
