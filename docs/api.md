# API Reference

Base URL: `http://localhost/api/` (Docker) or `http://localhost:8000/api/` (local dev)

## Authentication

Protected endpoints require a JWT access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `/api/auth/login/`. Access tokens expire after 1 hour; refresh via `/api/auth/token/refresh/`.

---

## Authentication Endpoints

### POST /api/auth/register/

Register a new user account.

**Request body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string",
  "phone": "string (optional)"
}
```

**Response `201`:**
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>",
  "user": { "id": 1, "username": "...", "email": "..." }
}
```

---

### POST /api/auth/login/

Authenticate with username and password.

**Request body:**
```json
{ "username": "string", "password": "string" }
```

**Response `200`:**
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>",
  "user": { "id": 1, "username": "...", "email": "..." }
}
```

---

### POST /api/auth/logout/

Blacklist the refresh token (requires authentication).

**Request body:**
```json
{ "refresh": "<jwt_refresh_token>" }
```

**Response `200`:** `{ "detail": "Logged out." }`

---

### GET /api/auth/profile/

Retrieve the authenticated user's profile.

**Response `200`:**
```json
{
  "id": 1, "username": "...", "email": "...",
  "first_name": "...", "last_name": "...", "phone": "..."
}
```

---

### PUT /api/auth/profile/

Update the authenticated user's profile.

**Request body:** Any subset of profile fields (username, email, first_name, last_name, phone).

---

### POST /api/auth/change-password/

Change the authenticated user's password.

**Request body:**
```json
{ "old_password": "string", "new_password": "string" }
```

---

### GET /api/auth/my-bookings/

List all bookings for the authenticated user.

**Response `200`:** Array of booking objects (see Bookings section).

---

### POST /api/auth/token/refresh/

Obtain a new access token using a refresh token.

**Request body:**
```json
{ "refresh": "<jwt_refresh_token>" }
```

**Response `200`:**
```json
{ "access": "<new_jwt_access_token>" }
```

---

## Movies

### GET /api/movies/

List all movies. Supports filtering and search.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `now_playing` or `upcoming` |
| `genre` | string | Filter by genre name |
| `search` | string | Search by title, director, or genre |
| `ordering` | string | Sort by field (e.g. `-rating`, `release_year`) |

**Response `200`:** Paginated list of movie objects.

---

### GET /api/movies/{id}/

Retrieve a single movie by ID.

**Response `200`:**
```json
{
  "id": 1,
  "title": "The Dark Knight",
  "description": "...",
  "duration": 152,
  "genre": "Action, Crime, Drama",
  "director": "Christopher Nolan",
  "release_year": 2008,
  "rating": "9.0",
  "status": "now_playing",
  "poster_url": "https://...",
  "trailer_url": "https://youtube.com/watch?v=...",
  "shots": ["https://...", "..."],
  "actors": [
    { "name": "Christian Bale", "character": "Bruce Wayne", "profile_path": "https://..." }
  ]
}
```

---

### POST /api/movies/ *(staff/admin only)*

Create a new movie.

### PUT/PATCH /api/movies/{id}/ *(staff/admin only)*

Update a movie.

### DELETE /api/movies/{id}/ *(staff/admin only)*

Delete a movie.

### POST /api/movies/add_from_tmdb/ *(staff/admin only)*

Import a movie directly from TMDB.

**Request body:**
```json
{ "tmdb_id": 155 }
```

---

## Movie Halls

### GET /api/moviehalls/

List all cinema halls.

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Αίθουσα 1",
    "capacity": 104,
    "layout": { ... },
    "photos": [{ "image": "/media/halls/hall1/hall1.webp", "order": 1 }]
  }
]
```

### GET /api/moviehalls/{id}/

Retrieve a single hall with full layout and photos.

### POST / PUT / PATCH / DELETE /api/moviehalls/{id}/ *(staff/admin only)*

Create or modify a cinema hall.

---

## Screenings

### GET /api/screenings/

List screenings. Supports filtering by movie and date.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `movie` | integer | Filter by movie ID |
| `date` | date | Filter by screening date (`YYYY-MM-DD`) |

**Response `200`:**
```json
[
  {
    "id": 1,
    "movie": 1,
    "hall": 1,
    "start_time": "2026-03-15T20:00:00+02:00",
    "price": "8.50",
    "available_seats": 88
  }
]
```

### GET /api/screenings/{id}/

Retrieve a single screening.

### GET /api/screenings/{id}/bookings/ *(staff/admin only)*

List all bookings for a specific screening.

### POST / PUT / PATCH / DELETE /api/screenings/{id}/ *(staff/admin only)*

Create or modify a screening.

---

## Bookings

### GET /api/bookings/

List bookings. Regular users see only their own; staff/admin see all.

### POST /api/bookings/

Create a booking (seat reservation before payment).

**Request body:**
```json
{
  "screening": 1,
  "seat_numbers": "A1,A2,A3",
  "customer_name": "Γιώργος Παπαδόπουλος",
  "customer_email": "user@example.com",
  "customer_phone": "6912345678"
}
```

**Response `201`:** Booking object with `id`, `total_price`, `status: "pending"`.

### GET /api/bookings/{id}/

Retrieve a single booking.

### POST /api/bookings/{id}/lock_seats/

Temporarily lock seats for a session (real-time seat locking).

**Request body:**
```json
{ "seat_numbers": ["A1", "A2"], "session_id": "<uuid>" }
```

### POST /api/bookings/{id}/unlock_seats/

Release previously locked seats.

---

## Payments (Stripe)

### GET /api/payments/config/

Retrieve the Stripe publishable key for the frontend.

**Response `200`:**
```json
{ "publishable_key": "pk_test_..." }
```

### POST /api/payments/create-booking-intent/

Create a Stripe PaymentIntent for a booking.

**Request body:**
```json
{ "booking_id": 1 }
```

**Response `200`:**
```json
{ "client_secret": "pi_..._secret_..." }
```

### POST /api/payments/create-subscription-checkout/

Create a Stripe Checkout Session for a CinemaPass subscription.

**Response `200`:**
```json
{ "checkout_url": "https://checkout.stripe.com/..." }
```

### POST /api/payments/webhook/

Stripe webhook endpoint. Handles `payment_intent.succeeded`, `checkout.session.completed`, and refund events. **Do not call directly.**

### POST /api/payments/refund/

Refund a completed booking.

**Request body:**
```json
{ "booking_id": 1 }
```

---

## Subscription (CinemaPass)

### GET /api/me/subscription/

Retrieve the authenticated user's CinemaPass subscription status.

**Response `200`:**
```json
{
  "active": true,
  "free_tickets_used": 2,
  "stripe_customer_id": "cus_..."
}
```

### POST /api/me/subscription/

Initiate a CinemaPass subscription checkout.

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Validation error — check `errors` field in response body |
| `401` | Missing or invalid JWT token |
| `403` | Insufficient permissions (requires staff/admin role) |
| `404` | Resource not found |
| `409` | Conflict (e.g. seat already booked) |
| `500` | Internal server error |

---

## Pagination

All list endpoints return paginated results:

```json
{
  "count": 42,
  "next": "http://localhost/api/movies/?page=2",
  "previous": null,
  "results": [ ... ]
}
```

Default page size: **10 items**.
