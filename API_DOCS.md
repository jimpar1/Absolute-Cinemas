# Cinema Backend – API & 3‑Tier Architecture

## 3‑Tier αρχιτεκτονική (απαιτήσεις εργασίας)

Η εφαρμογή ακολουθεί 3 επίπεδα:

1. **Front‑end (Presentation layer)**
	- Είναι ανεξάρτητο (π.χ. Angular/React/Vue ή mobile app).
	- Επικοινωνεί με το backend **μόνο μέσω RESTful web services** (HTTP + JSON) στα endpoints κάτω από `/api/`.
	- Δεν έχει άμεση πρόσβαση στη βάση.

2. **Business logic (Application layer)**
	- Υλοποιείται σε **Python/Django** (αντικειμενοστρεφής γλώσσα).
	- Τα REST endpoints υλοποιούνται με **Django REST Framework** (ViewSets/Serializers).
	- Η επιχειρησιακή λογική και οι κανόνες επικύρωσης/υπολογισμών βρίσκονται στα models/serializers/views/services.

3. **Database (Data layer)**
	- Χρησιμοποιείται **σχεσιακή βάση** (MySQL/MariaDB).
	- Η επικοινωνία από το business logic προς τη βάση γίνεται μέσω **ORM (Django ORM)**.

### Εσωτερική 3‑layer δομή (controllers / business logic / data) + Dependency Injection

Για να ταιριάζει με το μάθημα, εσωτερικά το backend χωρίζεται σε 3 layers:

- **Controllers:** DRF ViewSets/APIViews (π.χ. `cinema/views.py`, `cinema/auth_views.py`)
- **Business logic:** service classes (π.χ. `cinema/services.py`)
- **Data layer:** repository classes που μιλάνε με Django ORM (π.χ. `cinema/repositories.py`)

Η σύνδεση των layers γίνεται με **Dependency Injection** μέσω DI container (`dependency-injector`) που γίνεται wire στο startup της εφαρμογής (AppConfig `ready()`).

## Base URL

The base URL for all API endpoints is `/api/`.

## Authentication (JWT)

Το backend υλοποιεί βασικό authentication με **username/password** και προτείνεται η χρήση **JWT**.

Endpoints:

- `POST /api/auth/register/` (δημιουργία λογαριασμού)
- `POST /api/auth/login/` (λήψη `access` + `refresh` token)
- `POST /api/auth/logout/` (blacklist refresh token)
- `GET/PUT /api/auth/profile/` (προβολή/ενημέρωση προφίλ)
- `POST /api/auth/change-password/` (αλλαγή κωδικού για τον logged-in χρήστη)
- `GET /api/auth/my-bookings/` (κρατήσεις του χρήστη)
- `POST /api/auth/token/refresh/` (νέο access token)

Χρήση access token σε προστατευμένα endpoints:

- Header: `Authorization: Bearer <access_token>`

## Endpoints

### Movies

-   `GET /api/movies/`: Retrieve a list of all movies.
-   `POST /api/movies/`: Create a new movie.
-   `GET /api/movies/{id}/`: Retrieve a specific movie by its ID.
-   `PUT /api/movies/{id}/`: Update a specific movie.
-   `PATCH /api/movies/{id}/`: Partially update a specific movie.
-   `DELETE /api/movies/{id}/`: Delete a specific movie.
-   `GET /api/movies/{id}/screenings/`: Retrieve all screenings for a specific movie.
-   `GET /api/movies/search_tmdb/?query=<query>&page=<page>`: Search for movies on TMDB.
-   `GET /api/movies/popular_tmdb/?page=<page>`: Get popular movies from TMDB.
-   `GET /api/movies/tmdb_details/?movie_id=<id>`: Get details for a specific movie from TMDB.

### Screenings

-   `GET /api/screenings/`: Retrieve a list of all screenings.
-   `POST /api/screenings/`: Create a new screening.
-   `GET /api/screenings/{id}/`: Retrieve a specific screening by its ID.
-   `PUT /api/screenings/{id}/`: Update a specific screening.
-   `PATCH /api/screenings/{id}/`: Partially update a specific screening.
-   `DELETE /api/screenings/{id}/`: Delete a specific screening.
-   `GET /api/screenings/{id}/bookings/`: Retrieve all bookings for a specific screening.

### Bookings

-   `GET /api/bookings/`: Retrieve a list of all bookings.
-   `POST /api/bookings/`: Create a new booking.
-   `GET /api/bookings/{id}/`: Retrieve a specific booking by its ID.
-   `PUT /api/bookings/{id}/`: Update a specific booking.
-   `PATCH /api/bookings/{id}/`: Partially update a specific booking.
-   `DELETE /api/bookings/{id}/`: Delete a specific booking.

### Movie Halls

-   `GET /api/moviehalls/`: Retrieve a list of all movie halls.
-   `POST /api/moviehalls/`: Create a new movie hall.
-   `GET /api/moviehalls/{id}/`: Retrieve a specific movie hall by its ID.
-   `PUT /api/moviehalls/{id}/`: Update a specific movie hall.
-   `PATCH /api/moviehalls/{id}/`: Partially update a specific movie hall.
-   `DELETE /api/moviehalls/{id}/`: Delete a specific movie hall.
