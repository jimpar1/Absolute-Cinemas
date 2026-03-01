# Testing (pytest integration suite)

Το παρόν αρχείο περιγράφει **τι καλύπτουν** και **τι δεν καλύπτουν** τα integration tests του backend, καθώς και **τι ελέγχει το κάθε test αρχείο**.

## Πώς τρέχουν τα tests

### Προαπαιτούμενα

- Τα tests τρέχουν με **pytest + pytest-django**.
- Χρησιμοποιούν `DJANGO_SETTINGS_MODULE=cinema_backend.settings_test` (SQLite test DB).

### Εκτέλεση

```bash
python -m pytest
```

### Coverage

Το coverage τρέχει by default (δες `pytest.ini`).

```bash
python -m pytest
```

HTML report (προαιρετικό):

```bash
python -m pytest --cov-report=html
```

## Τι είδους tests είναι αυτά

- Είναι **integration tests στο API layer**:
  - Καλούν τα πραγματικά DRF endpoints μέσω `rest_framework.test.APIClient`.
  - Χρησιμοποιούν πραγματική test database (SQLite) και πραγματικά models/serializers/permissions.
- Δεν είναι unit tests των services.
- Τα TMDB-related endpoints τεστάρονται **χωρίς πραγματικά network calls** (γίνονται mocks στα service methods), ώστε τα tests να είναι deterministic.

## Τι καλύπτουμε (Covered)

### Auth (JWT)

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `POST /api/auth/token/refresh/`
- `GET/PUT /api/auth/profile/`
- `POST /api/auth/change-password/`
- `GET /api/auth/my-bookings/` (paginated)

Περιλαμβάνονται και **negative/error paths** (400/401) για βασικές περιπτώσεις.

### Movies

- `GET /api/movies/` (list) + pagination unwrap όπου χρειάζεται
- `GET /api/movies/{id}/` (retrieve) + 404
- `PUT/PATCH/DELETE /api/movies/{id}/` (write operations με permissions)
- Custom actions:
  - `GET /api/movies/{id}/screenings/`
  - `GET /api/movies/search_tmdb/` (mocked)
  - `GET /api/movies/popular_tmdb/` (mocked)
  - `GET /api/movies/tmdb_details/` (mocked)
  - `POST /api/movies/{id}/refresh_from_tmdb/` (mocked)
  - `POST /api/movies/create_from_tmdb/` (mocked)
  - `POST /api/movies/create_from_search/` (mocked)
- Επιβεβαιώνεται ότι το manual create είναι **disabled** (`POST /api/movies/` -> 405).

### Screenings

- `GET /api/screenings/` (list)
- `GET /api/screenings/{id}/` (retrieve)
- `POST/PUT/PATCH/DELETE /api/screenings/...` (write operations με permissions)
- Business rules (via serializer validation που καλεί `Screening.clean()`):
  - `start_time` minutes πρέπει να είναι :00 ή :30 (invalid -> 400)
  - απαγόρευση overlap screenings στην ίδια αίθουσα (invalid -> 400)
- Custom action:
  - `GET /api/screenings/{id}/bookings/` και permission requirement `cinema.view_booking`

### Seat locking

- `POST /api/screenings/{id}/lock_seats/`
- `POST /api/screenings/{id}/unlock_seats/`
- `GET /api/screenings/{id}/locked_seats/`

Καλύπτεται:
- missing payload -> 400
- conflict όταν seat είναι locked από άλλο session -> 400
- expiry takeover (>10’): expired lock μπορεί να «παρθεί» από άλλο session

### Bookings

- `GET /api/bookings/` (visibility: staff sees all, user sees own)
- `GET /api/bookings/{id}/`
- `POST /api/bookings/` (auth required)
- `PUT/PATCH/DELETE /api/bookings/{id}/`
- Business rules:
  - `seats_booked` δεν ξεπερνά διαθέσιμα (400)
  - reject seat_numbers ήδη booked (400)
  - reject seat_numbers locked από άλλο session (400)
  - status transitions + invalid status (400)
- Flow:
  - lock seats -> booking με ίδιο `session_id` -> locks cleared

### MovieHalls

- CRUD endpoints
- Permissions/roles: unauth vs non-staff vs staff-without-perms vs staff-with-perms

## Τι ΔΕΝ καλύπτουμε (Not covered / gaps)

### Management commands (0% coverage)

- `python manage.py bootstrap_accounts`
- `python manage.py refresh_movies_from_tmdb`

Δεν υπάρχουν tests που να τα τρέχουν ως commands.

### Django Admin UI

- Δεν υπάρχουν tests που να ανοίγουν/ελέγχουν το Django admin, τα custom admin views/forms/templates:
  - `cinema/admin/movie_admin.py` (Add from TMDB flow)
  - `cinema/admin/screening_admin.py` (weekly repetition / conflict skip logic)

### TMDB low-level HTTP integration

- `cinema/tmdb_service.py` είναι πρακτικά ακάλυπτο από tests (δεν γίνονται real HTTP calls).
- `cinema/services/movie_service.py` έχει χαμηλή κάλυψη, επειδή τα tests των TMDB endpoints κάνουν mocks στα service methods αντί να τρέχουν το πραγματικό parsing/validation.

### Μη-τεσταρισμένα API branches / edge cases

- Movies:
  - `tmdb_details` χωρίς `movie_id` -> 400
  - `create_from_tmdb` χωρίς/μη-ακέραιο `tmdb_id` -> 400
  - `create_from_search` χωρίς `query` -> 400, ή no results -> 404
  - `search_tmdb` χωρίς `query` -> 400 (από service)
  - ServiceError paths που επιστρέφουν `{error: ...}` με status από service
- Seat locks:
  - unlock all locks για session όταν δεν δοθεί `seat_numbers` (branch υπάρχει, δεν έχει test)
- Filters/search/ordering query params των viewsets:
  - Movies: `?search=...`, `?ordering=...`
  - Screenings: `?movie=...`, `?hall=...`, `?ordering=...`
  - Bookings: `?status=...`, `?search=...`, `?ordering=...`

## Τι ελέγχει το κάθε test αρχείο

### `cinema/tests/conftest.py`

- Κεντρικά pytest fixtures:
  - `api_client`
  - users: `user`, `customer_user`, `staff_user`, `staff_basic`
  - `make_staff_user(perm_codenames=[...])` για staff με συγκεκριμένα Django model permissions
  - domain fixtures: `hall`, `movie_data`, `movie`, `screening`, `booking`
- Strict schema helpers:
  - `assert_keys_equal(payload, expected_keys)`
  - `assert_keys_superset(payload, expected_keys)`
- Ορίζει τα expected response keys sets από serializers:
  - `MOVIE_FIELDS`, `SCREENING_FIELDS`, `MOVIE_HALL_FIELDS`
  - `BOOKING_RESPONSE_FIELDS` (εξαιρεί `session_id` γιατί είναι write-only)

### `cinema/tests/test_auth.py`

- Happy paths + strict response shape για register/login/profile/change-password/logout/refresh/my-bookings.
- Negative paths:
  - login missing fields (400)
  - login invalid creds (401)
  - κ.ά.
- `my-bookings` ελέγχεται ως **paginated** response (`count/next/previous/results`).

### `cinema/tests/test_movies.py`

- List/retrieve/404.
- Write operations με permissions (401/403/200/204 ανά ρόλο/perm).
- TMDB endpoints με mocks.
- `POST /api/movies/` manual create disabled (405).
- `screenings/` action.

### `cinema/tests/test_screenings.py`

- CRUD + strict schema (περιλαμβάνει nested `movie_details`).
- Permissions για add/change/delete.
- Business rules (invalid minutes / overlap).
- `bookings/` action permission (`view_booking`).
- Seat lock flows (lock/unlock/list), conflict + expiry takeover.

### `cinema/tests/test_bookings.py`

- CRUD + strict schema (nested `screening_details` -> `movie_details`).
- Auth requirement (unauth create -> 401).
- Business rules (availability, seat_numbers conflicts/locks, status transitions).
- Visibility staff vs user.
- Flow lock->book clears locks.

### `cinema/tests/test_movie_halls.py`

- CRUD + strict schema.
- Permissions για add/change/delete με model perms.

## Σημειώσεις / conventions

- Σε unauth write requests, το API επιστρέφει **401 (NotAuthenticated)** και όχι 403.
- Τα list endpoints μπορεί να είναι paginated· τα tests κάνουν unwrap το `results` όπου χρειάζεται.
