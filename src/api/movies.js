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

export async function getScreening(screeningId) {
    const res = await fetch(`http://127.0.0.1:8000/api/screenings/${screeningId}/`);
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

// Booking functions
export async function createBooking(bookingData) {
    const res = await fetch(`http://127.0.0.1:8000/api/bookings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
    });
    const data = await res.json();
    if (!res.ok) {
        console.error("Booking API error:", {status: res.status, data})
        throw new Error(data.detail || data.error || JSON.stringify(data) || "Booking failed")
    }
    return data;
}

export async function getScreeningBookings(screeningId) {
    const res = await fetch(`http://127.0.0.1:8000/api/screenings/${screeningId}/bookings/`);
    const data = await res.json();
    console.log("Raw bookings data from API:", data);
    
    // Extract all seat numbers from bookings
    const bookedSeats = [];
    
    // Handle both array and paginated response
    const bookings = Array.isArray(data) ? data : (data.results || []);
    console.log("Bookings array:", bookings);
    
    bookings.forEach(booking => {
        console.log("Processing booking:", booking);
        if (booking.seat_numbers) {
            // seat_numbers is a string like "A1,A2,B5"
            const seats = booking.seat_numbers.split(',').map(s => s.trim());
            console.log("Extracted seats:", seats);
            bookedSeats.push(...seats);
        }
    });
    
    console.log("Final booked seats:", bookedSeats);
    return bookedSeats;
}
