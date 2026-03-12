# AbsoluteCinema — Backend

## Τι είναι

Django REST API για τη διαχείριση κινηματογράφου. Παρέχει endpoints για ταινίες, προβολές, κρατήσεις εισιτηρίων, αίθουσες, πληρωμές μέσω Stripe και συνδρομές. Η frontend εφαρμογή (React) καταναλώνει αυτό το API.

---

## Τεχνολογίες

| Τεχνολογία | Χρήση |
|------------|-------|
| Python 3.12 | Γλώσσα |
| Django 5.x | Web framework |
| Django REST Framework | REST API |
| Simple JWT | Αυθεντικοποίηση με JWT tokens |
| PostgreSQL | Βάση δεδομένων |
| Stripe | Επεξεργασία πληρωμών |
| TMDB API | Μεταδεδομένα ταινιών |
| pytest | Tests |

---

## Προαπαιτούμενα

- Python 3.10+
- PostgreSQL (εγκατεστημένο και σε λειτουργία)

---

## Εγκατάσταση

```bash
git clone <repo-url>
cd Cinema-Django-Backend

python -m venv venv
pip install -r requirements.txt
```

| | Windows | Linux / macOS |
|---|---------|---------------|
| Ενεργοποίηση venv | `venv\Scripts\activate` | `source venv/bin/activate` |

---

## Ρύθμιση περιβάλλοντος

| | Windows | Linux / macOS |
|---|---------|---------------|
| Αντιγραφή .env | `copy .env.example .env` | `cp .env.example .env` |

Επεξεργαστείτε το `.env` και συμπληρώστε:

| Κλειδί | Περιγραφή |
|--------|-----------|
| `DB_NAME` | Όνομα βάσης δεδομένων |
| `DB_USER` | Χρήστης PostgreSQL |
| `DB_PASSWORD` | Κωδικός PostgreSQL |
| `DB_ADMIN_DB` | Admin database για bootstrap (`postgres`) |
| `SECRET_KEY` | Django secret key |
| `STRIPE_SECRET_KEY` | Stripe secret key (test ή live) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `TMDB_API_KEY` | API key από themoviedb.org |

---

## Δημιουργία βάσης & αρχικά δεδομένα

Τρέξτε το κατάλληλο script ανάλογα με το λειτουργικό σύστημα:

```bash
# Linux / macOS
python create_db_linux.py

# Windows
python create_db_windows.py
```

Τα scripts κάνουν αυτόματα:

1. Δημιουργία βάσης δεδομένων
2. Εκτέλεση migrations
3. Δημιουργία χρηστών (admin, staff, user)
4. Δημιουργία αιθουσών με φωτογραφίες
5. Φόρτωση ταινιών από το TMDB API

---

## Εκτέλεση server

```bash
python manage.py runserver
```

Ο server εκκινεί στο `http://127.0.0.1:8000/`.

---

## Demo λογαριασμοί

| Χρήστης | Κωδικός | Ρόλος |
|---------|---------|-------|
| `admin` | `admin` | Διαχειριστής |
| `staff` | `staff` | Προσωπικό |
| `user` | `user` | Απλός χρήστης |

---

## Αρχιτεκτονική

Το API ακολουθεί τριεπίπεδη αρχιτεκτονική:

```
Views (DRF APIView)
  └── Services (business logic)
        └── Repositories (DB queries)
              └── Django ORM
```

- **Views**: παραλαβή request, validation, επιστροφή response
- **Services**: επιχειρηματική λογική, ορχήστρωση
- **Repositories**: μοναδικό σημείο πρόσβασης στη βάση

---

## API Endpoints

### Auth
| Method | Path | Περιγραφή |
|--------|------|-----------|
| POST | `/api/auth/register/` | Εγγραφή χρήστη |
| POST | `/api/auth/login/` | Σύνδεση (επιστρέφει JWT) |
| POST | `/api/auth/token/refresh/` | Ανανέωση access token |
| GET | `/api/auth/me/` | Προφίλ συνδεδεμένου χρήστη |

### Movies
| Method | Path | Περιγραφή |
|--------|------|-----------|
| GET | `/api/movies/` | Λίστα ταινιών |
| GET | `/api/movies/{id}/` | Λεπτομέρειες ταινίας |

### Screenings
| Method | Path | Περιγραφή |
|--------|------|-----------|
| GET | `/api/screenings/` | Λίστα προβολών |
| GET | `/api/screenings/{id}/` | Λεπτομέρειες προβολής |
| GET | `/api/screenings/{id}/seats/` | Διαθέσιμες θέσεις |

### Bookings
| Method | Path | Περιγραφή |
|--------|------|-----------|
| GET | `/api/bookings/` | Κρατήσεις χρήστη |
| POST | `/api/bookings/` | Νέα κράτηση |
| GET | `/api/bookings/{id}/` | Λεπτομέρειες κράτησης |

### Halls
| Method | Path | Περιγραφή |
|--------|------|-----------|
| GET | `/api/halls/` | Λίστα αιθουσών |
| GET | `/api/halls/{id}/` | Λεπτομέρειες αίθουσας |

### Payments
| Method | Path | Περιγραφή |
|--------|------|-----------|
| POST | `/api/payments/create-intent/` | Δημιουργία Stripe PaymentIntent |
| POST | `/api/payments/confirm/` | Επιβεβαίωση πληρωμής |

### Subscription
| Method | Path | Περιγραφή |
|--------|------|-----------|
| GET | `/api/subscription/` | Κατάσταση συνδρομής |
| POST | `/api/subscription/subscribe/` | Ενεργοποίηση συνδρομής |

---

## Tests

```bash
python -m pytest
```

Τα tests χρησιμοποιούν SQLite ως test βάση (ορίζεται στο `pytest.ini`), χωρίς να χρειάζεται PostgreSQL.
