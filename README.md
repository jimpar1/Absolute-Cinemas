# Absolute Cinema — Django REST Backend

Backend για σύστημα κινηματογράφου (ταινίες, αίθουσες, προβολές, κρατήσεις) με **Django REST Framework**, **JWT auth**, και **TMDB integration**.

- **REST API**: http://127.0.0.1:8000/api/
- **Django Admin**: http://127.0.0.1:8000/admin/

Για πλήρη λίστα endpoints: δες το [API_DOCS.md](API_DOCS.md).

## Περιεχόμενα

- [TL;DR (Local setup)](#tldr-local-setup)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture (3‑tier + internal layers)](#architecture-3tier--internal-layers)
- [Database configuration](#database-configuration)
- [Demo accounts (seeded)](#demo-accounts-seeded)
- [API overview](#api-overview)
- [Django admin](#django-admin)
- [Management commands](#management-commands)
- [Tests](#tests)
- [Project structure (high level)](#project-structure-high-level)
- [Notes / troubleshooting](#notes--troubleshooting)
- [Docs](#docs)

---

## TL;DR (Local setup)

1) Create virtualenv + install deps

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

2) (Προαιρετικά) ρύθμισε DB env vars

- Αν η MariaDB είναι default (`root`, no password, `3306`), μπορείς να το παραλείψεις.

**Windows (PowerShell):**
```powershell
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
$env:DB_NAME="cinema_db"
$env:DB_USER="root"
$env:DB_PASSWORD=""
```

**Linux/macOS (Bash):**
```bash
export DB_HOST="127.0.0.1"
export DB_PORT="3306"
export DB_NAME="cinema_db"
export DB_USER="root"
export DB_PASSWORD=""
```

3) Create DB + seed data (drops & recreates DB)

```bash
# Windows
python create_db_windows.py

# Linux / macOS
python create_db_linux.py
```

4) Run server

```bash
python manage.py runserver
```

Για πιο αναλυτικές οδηγίες: δες το [RUNNING_INSTRUCTIONS.md](RUNNING_INSTRUCTIONS.md).

---

## Features

- **JWT Authentication** (register/login/logout/refresh) + profile endpoints
- **Change password** για τον logged-in user
- **Movies**: CRUD (με περιορισμούς) + TMDB proxy/import endpoints
- **Screenings**: CRUD + validation (ώρα/overlaps) + seat locking
- **Bookings**: CRUD (auth required) + role-based visibility
- **Movie halls**: CRUD + auto-generated **layout JSON** (Main/Balcony, left/middle/right sections)
- **Seat locking**: προσωρινό κλείδωμα θέσεων (10 λεπτά) ανά session
- **Django Admin** + staff permissions μέσω Group ("Cinema Staff")
- **3‑tier / layered architecture** με Repositories + Services + Controllers και **Dependency Injection**

---

## Tech stack

- Python 3.10+
- Django (5.x)
- Django REST Framework
- `djangorestframework-simplejwt` (JWT)
- MariaDB / MySQL
- `dependency-injector` (DI container)
- `tmdbv3api` (TMDB)
- `django-filter` + `corsheaders`

---

## Architecture (3‑tier + internal layers)

Σύμφωνα με την 3‑tier λογική:

- **Presentation**: π.χ. React frontend (μιλάει μόνο με HTTP/JSON)
- **Application/Business**: Django/DRF (κανόνες, validation, flows)
- **Data**: MariaDB/MySQL (μέσω Django ORM)

Εσωτερικά το backend είναι οργανωμένο σε:

- **Controllers**: [cinema/views/](cinema/views/) και [cinema/auth_views.py](cinema/auth_views.py)
- **Business logic**: [cinema/services/](cinema/services/)
- **Data access**: [cinema/repositories.py](cinema/repositories.py) (wrappers πάνω από Django ORM QuerySets)
- **DI wiring**: [cinema/container.py](cinema/container.py) (providers) + [cinema/apps.py](cinema/apps.py) (wire στο startup)

---

## Απαιτήσεις μαθήματος (6–8) — Τι χρησιμοποιήθηκε εδώ

### 6. Backend: API σε 3 Layers + Dependency Injection (υποχρεωτικό)

Το project είναι **REST API** με ξεκάθαρο διαχωρισμό σε 3 layers:

- **Controllers (API layer)**
  - DRF ViewSets: [cinema/views/movie_views.py](cinema/views/movie_views.py), [cinema/views/screening_views.py](cinema/views/screening_views.py), [cinema/views/booking_views.py](cinema/views/booking_views.py), [cinema/views/movie_hall_views.py](cinema/views/movie_hall_views.py)
  - Auth endpoints: [cinema/auth_views.py](cinema/auth_views.py)
- **Business Logic (services layer)**
  - Services όπως [cinema/services/movie_service.py](cinema/services/movie_service.py), [cinema/services/seat_lock_service.py](cinema/services/seat_lock_service.py), [cinema/services/booking_service.py](cinema/services/booking_service.py)
- **Data layer (repositories layer)**
  - Repositories που μιλάνε με ORM: [cinema/repositories.py](cinema/repositories.py)

**Dependency Injection** υλοποιείται με `dependency-injector`:

- Ο container ορίζεται στο [cinema/container.py](cinema/container.py) (providers για repositories/services)
- Γίνεται wiring στο startup από το [cinema/apps.py](cinema/apps.py)
- Στα controllers γίνεται injection με `@inject` και `Provide[...]` (π.χ. στα ViewSets και στο auth)

### 7. Βάση δεδομένων: σχεσιακή DB

Η σχεσιακή βάση που χρησιμοποιείται στο dev setup είναι **MariaDB / MySQL**.

- Django DB engine: `django.db.backends.mysql` στο [cinema_backend/settings.py](cinema_backend/settings.py)
- Ρύθμιση σύνδεσης μέσω env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Seed/reset scripts που κάνουν drop+create DB:
  - Windows: [create_db_windows.py](create_db_windows.py) (driver: PyMySQL)
  - Linux/macOS: [create_db_linux.py](create_db_linux.py) (driver: mysqlclient)

### 8. ORM: επικοινωνία μέσω ORM (Django ORM)

Η επικοινωνία με τη βάση γίνεται μέσω **Django ORM**:

- Models: [cinema/models/](cinema/models/)
- Repositories εκθέτουν `list()/get()/filter()` πάνω από QuerySets: [cinema/repositories.py](cinema/repositories.py)
- Τα services δουλεύουν πάνω από repositories (όχι raw SQL): [cinema/services/](cinema/services/)

> Εξαίρεση: τα scripts setup της βάσης ([create_db_windows.py](create_db_windows.py), [create_db_linux.py](create_db_linux.py)) χρησιμοποιούν MySQL driver μόνο για **DROP/CREATE DATABASE**. Όλο το application data access γίνεται από Django ORM.

---

## Database configuration

Η σύνδεση στη βάση ελέγχεται από τα env vars:

- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `3306`)
- `DB_NAME` (default: `cinema_db`)
- `DB_USER` (default: `root`)
- `DB_PASSWORD` (default: empty)

> Σημείωση: τα scripts `create_db_windows.py` / `create_db_linux.py` κάνουν **DROP DATABASE IF EXISTS**. Χρησιμοποίησέ τα μόνο σε local/dev.

---

## Demo accounts (seeded)

Μετά το `create_db_*.py` υπάρχουν:

| Role | Username | Password |
|------|----------|----------|
| Admin (superuser) | `admin` | `admin` |
| Staff (limited admin perms) | `staff` | `staff` |
| Regular user | `user` | `user` |

Το staff user μπαίνει στο group **Cinema Staff** με model-level permissions (movies/halls/screenings full CRUD, bookings view/change).

---

## API overview

Base URL: `/api/`

### Auth (JWT)

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/` (blacklists refresh token)
- `POST /api/auth/token/refresh/`
- `GET/PUT /api/auth/profile/`
- `GET /api/auth/my-bookings/`
- `POST /api/auth/change-password/`

Σε protected endpoints:

- Header: `Authorization: Bearer <access_token>`

### Movies

- `GET /api/movies/` (public)
- `GET /api/movies/{id}/`
- `GET /api/movies/{id}/screenings/`

TMDB endpoints:

- `GET /api/movies/search_tmdb/?query=...&page=1`
- `GET /api/movies/popular_tmdb/?page=1`
- `GET /api/movies/tmdb_details/?movie_id=...`
- `POST /api/movies/create_from_tmdb/` body: `{ "tmdb_id": 238 }`
- `POST /api/movies/create_from_search/` body: `{ "query": "Inception" }`
- `POST /api/movies/{id}/refresh_from_tmdb/`

> Manual `POST /api/movies/` είναι απενεργοποιημένο: οι ταινίες εισάγονται από TMDB.

### Screenings

- `GET /api/screenings/` (public)
- `POST/PUT/PATCH/DELETE /api/screenings/...` (staff w/ perms)

Bookings ανά screening (staff που έχει `cinema.view_booking`):

- `GET /api/screenings/{id}/bookings/`

Seat locking:

- `POST /api/screenings/{id}/lock_seats/` body: `{ "seat_numbers": ["A1","A2"], "session_id": "..." }`
- `POST /api/screenings/{id}/unlock_seats/` body: `{ "seat_numbers": ["A1"], "session_id": "..." }`
- `GET  /api/screenings/{id}/locked_seats/`

Locks λήγουν μετά από **10 λεπτά**.

### Bookings

- `GET /api/bookings/` (auth required)
- `POST /api/bookings/` (auth required)

Visibility:

- Staff: βλέπει όλες τις κρατήσεις
- Regular user: βλέπει μόνο τις δικές του

---

## Django admin

- URL: `/admin/`
- Το seeded staff user έχει περιορισμένα δικαιώματα μέσω group permissions.

---

## Management commands

- Create/update dev accounts (idempotent):

```bash
python manage.py bootstrap_accounts
```

Προαιρετικά μπορείς να δώσεις credentials μέσω env vars ή flags:

- `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `STAFF_USERNAME`, `STAFF_EMAIL`, `STAFF_PASSWORD`

- Refresh movie assets from TMDB for existing movies:

```bash
python manage.py refresh_movies_from_tmdb
python manage.py refresh_movies_from_tmdb --only-missing
```

---

## Tests

Υπάρχουν integration tests στο `cinema/tests/` γραμμένα σε **pytest** style και υπάρχει `cinema_backend/settings_test.py` που χρησιμοποιεί **SQLite**.

Για αναλυτικά (τι καλύπτουμε/τι δεν καλύπτουμε + ανά test αρχείο): δες το [TESTING.md](TESTING.md).

Τρέξε τα tests με pytest (προτείνεται το `python -m pytest`):

```bash
python -m pytest
```

Coverage report (τρέχει αυτόματα μαζί με τα tests):

```bash
python -m pytest
```

Προαιρετικά, HTML coverage report:

```bash
python -m pytest --cov-report=html
```

> Εναλλακτικά, μπορείς να τρέξεις `python manage.py test`, αλλά τα υπάρχοντα tests είναι σχεδιασμένα για pytest.

---

## Project structure (high level)

- `cinema_backend/` — Django project settings/urls
- `cinema/`
  - `views/` — DRF ViewSets (controllers)
  - `services/` — business logic
  - `repositories.py` — data access layer (ORM wrappers)
  - `models/` — domain models
  - `serializers/` — DRF serializers
  - `management/commands/` — custom commands
  - `admin/` + `templates/admin/` — admin customizations

---

## Notes / troubleshooting

- **Linux mysqlclient**: μπορεί να χρειαστείς dev packages:

```bash
sudo apt install python3-dev default-libmysqlclient-dev build-essential pkg-config
```

- **CORS**: για development είναι `CORS_ALLOW_ALL_ORIGINS=True`.

---

## Docs

- Full endpoints & architecture notes: [API_DOCS.md](API_DOCS.md)
- Installation / run guide: [RUNNING_INSTRUCTIONS.md](RUNNING_INSTRUCTIONS.md)
