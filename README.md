# AbsoluteCinema

[![CI](https://github.com/jimpar1/Absolute-Cinemas/actions/workflows/ci.yml/badge.svg)](https://github.com/jimpar1/Absolute-Cinemas/actions/workflows/ci.yml)
[![CodeQL](https://github.com/jimpar1/Absolute-Cinemas/actions/workflows/codeql.yml/badge.svg)](https://github.com/jimpar1/Absolute-Cinemas/actions/workflows/codeql.yml)
[Deployed App Link](https://absolutecinemas.gr)

Πλατφόρμα διαχείρισης και κρατήσεων εισιτηρίων κινηματογράφου. React frontend, Django REST backend, PostgreSQL βάση δεδομένων.

## Documentation

| Αρχείο | Περιεχόμενο |
|--------|------------|
| [docs/api.md](docs/api.md) | Πλήρης αναφορά REST API (endpoints, auth, request/response) |
| [docs/architecture.md](docs/architecture.md) | 3-tier αρχιτεκτονική, ER διάγραμμα, δομή κώδικα |
| [docs/dependencies.md](docs/dependencies.md) | Frontend και backend εξαρτήσεις |
| [docs/deployment.md](docs/deployment.md) | Docker, env vars, production checklist |
| [docs/contributing.md](docs/contributing.md) | Branching, PR process, commit conventions |
| [docs/cicd.md](docs/cicd.md) | CI/CD workflows, badges, Railway/Render integration |
| [docs/methodology.md](docs/methodology.md) | Μεθοδολογία ανάπτυξης GitHub Flow (ελληνικά) |

## Απαιτήσεις

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/)

## Εκκίνηση

```bash
# 1. Αντίγραφο αρχείου ρυθμίσεων
cp .env.example .env

# 2. Συμπλήρωσε τα secrets στο .env
#    (SECRET_KEY, DB_PASSWORD, STRIPE_*, TMDB_API_KEY)

# 3. Εκκίνηση
docker compose up --build
```

Η εφαρμογή είναι διαθέσιμη στο **http://localhost**.

Κατά την πρώτη εκκίνηση το backend:
- Εφαρμόζει migrations
- Δημιουργεί λογαριασμούς admin / staff
- Εισάγει αίθουσες και ταινίες από TMDB

Οι επόμενες εκκινήσεις παρακάμπτουν αυτόματα το seeding.

## Δομή project

```
Absolute-Cinemas/
├── FrontEnd/          React 19 + Vite + Tailwind
├── BackEnd/           Django 5 + DRF + Gunicorn
├── docker-compose.yml
└── .env.example
```

## Χρήσιμες εντολές

```bash
# Εκκίνηση στο background
docker compose up -d --build

# Logs backend
docker compose logs -f backend

# Django shell
docker compose exec backend python manage.py shell

# Δημιουργία superuser χειροκίνητα
docker compose exec backend python manage.py createsuperuser

# Επανεισαγωγή δεδομένων (αν χρειαστεί)
docker compose exec backend python manage.py seed_db

# Τερματισμός και διαγραφή volumes (ΚΑΘΑΡΙΖΕΙ ΤΗ ΒΑΣΗ)
docker compose down -v
```

> Το `docker compose down` χωρίς `-v` **δεν** διαγράφει τα δεδομένα της βάσης.

## Μεταβλητές περιβάλλοντος

| Μεταβλητή | Περιγραφή | Προεπιλογή |
|-----------|-----------|-----------|
| `SECRET_KEY` | Django secret key | insecure default |
| `DEBUG` | `True` / `False` | `True` |
| `ALLOWED_HOSTS` | Comma-separated hostnames | `localhost,...` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins (non-debug) | `http://localhost` |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF checks | `http://localhost:8080,...` |
| `DB_NAME` | PostgreSQL database name | `cinema_db` |
| `DB_USER` | PostgreSQL username | `cinema_user` |
| `DB_PASSWORD` | PostgreSQL password | `cinema_pass` |
| `ADMIN_USERNAME` | Initial admin username | `admin` |
| `ADMIN_PASSWORD` | Initial admin password | `Admin123!` |
| `STRIPE_SECRET_KEY` | Stripe secret key | — |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | — |
| `TMDB_API_KEY` | TMDB API key | hardcoded fallback |

## Μεθοδολογία

Δες [docs/methodology.md](docs/methodology.md) για την τεκμηρίωση της μεθοδολογίας ανάπτυξης (GitHub Flow).
