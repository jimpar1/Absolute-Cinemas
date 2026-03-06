# Ανάπτυξη (Deployment)

## Docker (συνιστάται)

### Προαπαιτούμενα

- [Docker](https://docs.docker.com/get-docker/) >= 24
- [Docker Compose](https://docs.docker.com/compose/) >= 2.20 (συμπεριλαμβάνεται στο Docker Desktop)

### Γρήγορη εκκίνηση

```bash
# Κλωνοποίηση αποθετηρίου
git clone https://github.com/jimpar1/AbsoluteCinemasV2.git
cd AbsoluteCinemasV2

# Αντίγραφο αρχείου μεταβλητών περιβάλλοντος
cp .env.example .env
# Άνοιξε το .env και συμπλήρωσε: SECRET_KEY, DB_PASSWORD, STRIPE_*, TMDB_API_KEY

# Δημιουργία και εκκίνηση όλων των υπηρεσιών
docker compose up --build
```

Η εφαρμογή είναι διαθέσιμη στο **http://localhost**.

Κατά την πρώτη εκκίνηση το backend αυτόματα:
1. Αναμένει να είναι έτοιμη η PostgreSQL
2. Εκτελεί `manage.py migrate`
3. Εκτελεί `manage.py collectstatic`
4. Δημιουργεί λογαριασμούς admin και staff (`bootstrap_accounts`)
5. Αρχικοποιεί αίθουσες και εισάγει ταινίες από TMDB (`seed_db --skip-if-seeded`)
6. Εκκινεί το Gunicorn

Στις επόμενες εκκινήσεις τα βήματα 4–5 παραλείπονται αυτόματα.

---

### Υπηρεσίες

| Υπηρεσία | Image | Πόρτα (εσωτερική) | Περιγραφή |
|---------|-------|-------------------|-----------|
| `db` | postgres:16-alpine | 5432 | Βάση δεδομένων PostgreSQL |
| `backend` | custom (python:3.12-slim) | 8000 | Django REST API |
| `frontend` | custom (nginx:alpine) | 80 | React SPA + reverse proxy |

### Χρήσιμες εντολές

```bash
# Εκκίνηση στο παρασκήνιο
docker compose up -d --build

# Logs backend
docker compose logs -f backend

# Django shell
docker compose exec backend python manage.py shell

# Δημιουργία superuser χειροκίνητα
docker compose exec backend python manage.py createsuperuser

# Επανεισαγωγή δεδομένων (αν χρειαστεί)
docker compose exec backend python manage.py seed_db

# Τερματισμός (διατηρεί τα δεδομένα βάσης)
docker compose down

# Τερματισμός και διαγραφή volumes (ΔΙΑΓΡΑΦΕΙ ΤΗ ΒΑΣΗ)
docker compose down -v
```

> Το `docker compose down` χωρίς `-v` **δεν** διαγράφει τα δεδομένα της βάσης.

---

## Μεταβλητές Περιβάλλοντος

Όλες οι μεταβλητές διαβάζονται από το `.env` κατά την εκκίνηση.

| Μεταβλητή | Απαιτείται | Προεπιλογή | Περιγραφή |
|-----------|-----------|-----------|-----------|
| `SECRET_KEY` | Ναι | insecure default | Django secret key — χρησιμοποίησε μακρά τυχαία συμβολοσειρά σε παραγωγή |
| `DEBUG` | Όχι | `True` | Ορίσε σε `False` σε παραγωγή |
| `ALLOWED_HOSTS` | Όχι | `localhost,...` | Διαχωρισμένα με κόμμα hostnames |
| `CORS_ALLOWED_ORIGINS` | Όχι | `http://localhost` | Επιτρεπόμενα CORS origins (όταν `DEBUG=False`) |
| `DB_NAME` | Όχι | `cinema_db` | Όνομα βάσης δεδομένων PostgreSQL |
| `DB_USER` | Όχι | `cinema_user` | Username PostgreSQL |
| `DB_PASSWORD` | Ναι | `cinema_pass` | Κωδικός PostgreSQL |
| `DB_HOST` | Όχι | `db` | Hostname PostgreSQL (όνομα υπηρεσίας Docker) |
| `DB_PORT` | Όχι | `5432` | Πόρτα PostgreSQL |
| `ADMIN_USERNAME` | Όχι | `admin` | Username αρχικού admin λογαριασμού |
| `ADMIN_PASSWORD` | Όχι | `Admin123!` | Κωδικός αρχικού admin λογαριασμού |
| `TMDB_API_KEY` | Όχι | hardcoded fallback | TMDB API key για εισαγωγή ταινιών |
| `STRIPE_SECRET_KEY` | Όχι | — | Stripe secret key (οι πληρωμές απενεργοποιούνται αν λείπει) |
| `STRIPE_PUBLISHABLE_KEY` | Όχι | — | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Όχι | — | Stripe webhook signing secret |

---

## Τοπική εγκατάσταση χωρίς Docker

### Backend

```bash
cd BackEnd

# Δημιουργία virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Εγκατάσταση εξαρτήσεων
pip install -r requirements.txt

# Αντίγραφο env αρχείου και ρύθμιση (τουλάχιστον DB_* για τοπική PostgreSQL)
cp ../.env.example .env

# Εφαρμογή migrations
python manage.py migrate

# Αρχικοποίηση δεδομένων
python manage.py bootstrap_accounts
python manage.py seed_db

# Εκκίνηση development server
python manage.py runserver
```

### Frontend

```bash
cd FrontEnd

# Εγκατάσταση εξαρτήσεων
npm install

# Ορισμός URL backend
echo "VITE_API_URL=http://localhost:8000" > .env

# Εκκίνηση development server
npm run dev
```

Το frontend θα είναι διαθέσιμο στο **http://localhost:5173**.

---

## Checklist παραγωγής

Πριν από deployment σε περιβάλλον παραγωγής:

- [ ] Ορισμός `SECRET_KEY` σε μακρά, τυχαία, μοναδική συμβολοσειρά
- [ ] Ορισμός `DEBUG=False`
- [ ] Ορισμός `ALLOWED_HOSTS` στο πραγματικό domain
- [ ] Ορισμός `CORS_ALLOWED_ORIGINS` στο URL του frontend
- [ ] Χρήση ισχυρού `DB_PASSWORD`
- [ ] Ορισμός `ADMIN_PASSWORD` σε ασφαλή κωδικό
- [ ] Ρύθμιση Stripe live-mode keys (αφαίρεση `sk_test_` / `pk_test_`)
- [ ] Ρύθμιση HTTPS (π.χ. μέσω Traefik ή Cloudflare)
- [ ] Ρύθμιση τακτικών αντιγράφων ασφαλείας βάσης δεδομένων

---

## Δωρεάν επιλογές hosting

| Υπηρεσία | Δωρεάν PostgreSQL | Σημειώσεις |
|---------|----------------|-----------|
| [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform) | Ναι (Managed PG) | Εγγενής υποστήριξη DOCR · αυτόματο deploy μέσω `doctl` |
| [Railway](https://railway.app) | Ναι | Εγγενής υποστήριξη Docker |
| [Render](https://render.com) | Ναι (90 ημέρες) | Υποστηρίζει Docker και native buildpacks |
| [Supabase](https://supabase.com) | Ναι | Managed PostgreSQL, χρήση ως εξωτερική βάση |
| [Neon](https://neon.tech) | Ναι | Serverless PostgreSQL |

---

## Deployment σε DigitalOcean App Platform (προτεινόμενο)

Το project περιλαμβάνει πλήρη υποστήριξη για αυτόματη ανάπτυξη στο **DigitalOcean App Platform** μέσω του CLI εργαλείου `doctl`.

### Προαπαιτούμενα

1. Λογαριασμός [DigitalOcean](https://cloud.digitalocean.com)
2. Εγκατεστημένο [`doctl`](https://docs.digitalocean.com/reference/doctl/how-to/install/)
3. Container Registry δημιουργημένο στο DO dashboard

### Χειροκίνητη εκτέλεση (πρώτη φορά)

```bash
# Σύνδεση με το API token σου
doctl auth init

# Σύνδεση στο DO Container Registry
doctl registry login

# Build και push των images
docker build -t registry.digitalocean.com/<registry>/absolutecinemas-backend:latest ./BackEnd
docker push registry.digitalocean.com/<registry>/absolutecinemas-backend:latest

docker build -t registry.digitalocean.com/<registry>/absolutecinemas-frontend:latest ./FrontEnd
docker push registry.digitalocean.com/<registry>/absolutecinemas-frontend:latest

# Δημιουργία εφαρμογής από το spec αρχείο
doctl apps create --spec .do/app.yaml

# Ανάπτυξη νέας έκδοσης σε υπάρχουσα εφαρμογή
doctl apps create-deployment <APP_ID> --force-rebuild --wait
```

### Αυτόματο CI/CD (GitHub Actions)

Ρύθμισε τα παρακάτω **Repository Secrets** στο GitHub:

| Secret | Περιγραφή |
|--------|-----------|
| `DIGITALOCEAN_ACCESS_TOKEN` | Personal API token από το DO dashboard |
| `DO_REGISTRY_NAME` | Όνομα του Container Registry (π.χ. `my-registry`) |
| `DO_APP_ID` | ID της App Platform εφαρμογής (μετά την πρώτη δημιουργία) |

Κάθε push στο `master` branch θα:
1. Δημιουργεί νέα Docker images
2. Τις ανεβάζει στο DO Container Registry
3. Εκτελεί νέο deployment στο App Platform
