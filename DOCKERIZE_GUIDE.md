# How to Dockerize a Django + React Project into a Monorepo

This is a step-by-step guide based on this exact project (AbsoluteCinemas).
You started with two separate repos — a **Django backend** and a **React/Vite frontend** — and combined them into one **monorepo** with Docker, GitHub Actions, and a PostgreSQL database.

---

## 1. Monorepo Structure

Create a new repo and organize it like this:

```
my-project/
├── BackEnd/               ← your Django project
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── requirements.txt
│   ├── manage.py
│   ├── cinema_backend/
│   │   ├── settings.py
│   │   └── ...
│   └── ...
├── FrontEnd/              ← your React/Vite project
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   └── src/
│       └── ...
├── docker-compose.yml     ← orchestrates all services
├── .env                   ← secrets (never commit this!)
├── .env.example           ← template to commit instead
└── .github/
    └── workflows/
        ├── ci.yml
        ├── docker-build.yml
        ├── deploy.yml
        ├── release.yml
        ├── security.yml
        └── codeql.yml
```

---

## 2. Backend — `BackEnd/Dockerfile`

Use `python:3.12-slim`. No need for build tools if you use `psycopg2-binary`.

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
```

**Key rules:**
- Use `psycopg2-binary` (not `psycopg2`) — avoids needing `gcc`/`libpq-dev`
- `COPY requirements.txt .` before `COPY . .` so Docker caches the pip layer

---

## 3. Backend — `BackEnd/requirements.txt`

```
Django>=5.1
djangorestframework>=3.14.0
djangorestframework-simplejwt>=5.3.0
django-cors-headers>=4.3.0
django-filter>=23.0
psycopg2-binary>=2.9.0        # ← NOT psycopg2 (binary = no compilation needed)
gunicorn>=21.0.0               # ← production WSGI server (required!)
Pillow>=10.0.0                 # ← required if you use ImageField
python-dotenv
stripe>=8.0.0
# ... your other deps
```

> ⚠️ **Common mistake:** forgetting `gunicorn` — Django's dev server won't start in Docker.

---

## 4. Backend — `BackEnd/entrypoint.sh`

This script runs on every container start. It waits for the DB, runs migrations, and starts gunicorn.

```sh
#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until python -c "
import os, psycopg2
psycopg2.connect(
    dbname=os.environ.get('DB_NAME', 'cinema_db'),
    user=os.environ.get('DB_USER', 'cinema_user'),
    password=os.environ.get('DB_PASSWORD', 'cinema_pass'),
    host=os.environ.get('DB_HOST', 'db'),
    port=os.environ.get('DB_PORT', '5432'),
)
" 2>/dev/null; do
    echo "  PostgreSQL not ready — retrying in 2s..."
    sleep 2
done
echo "PostgreSQL is ready."

python manage.py migrate --no-input
python manage.py collectstatic --no-input

# Any idempotent seed commands here (safe to run every boot)
python manage.py bootstrap_accounts

exec gunicorn your_project.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120
```

> Replace `your_project.wsgi` with your actual Django project name (the folder that contains `settings.py`).

---

## 5. Backend — `BackEnd/cinema_backend/settings.py`

**Critical:** settings must read everything from environment variables, not be hardcoded.

```python
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Read from env — never hardcode!
SECRET_KEY = os.environ.get('SECRET_KEY', 'insecure-dev-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

_hosts = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,backend,testserver')
ALLOWED_HOSTS = [h.strip() for h in _hosts.split(',') if h.strip()]

# ... INSTALLED_APPS, MIDDLEWARE, etc. ...

# PostgreSQL — reads from Docker env vars
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'cinema_db'),
        'USER': os.environ.get('DB_USER', 'cinema_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'cinema_pass'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Static & media files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'   # ← required for collectstatic in Docker
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# CORS — reads from env, falls back to allow-all in dev
_cors = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _cors:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(',') if o.strip()]
else:
    CORS_ALLOW_ALL_ORIGINS = True

# API keys from env
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
TMDB_API_KEY = os.environ.get('TMDB_API_KEY', '')
```

> ⚠️ **Common mistake #1:** keeping `DATABASES` pointed at MySQL/localhost — it must switch to PostgreSQL reading from env vars.  
> ⚠️ **Common mistake #2:** forgetting `STATIC_ROOT` — `collectstatic` crashes without it.

---

## 6. Frontend — `FrontEnd/Dockerfile`

Multi-stage build: Node builds the app, nginx serves it.

```dockerfile
# Stage 1: Build the React app
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Leave VITE_API_URL empty — nginx proxies /api/ to the backend
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

**Key rules:**
- `COPY package*.json ./` then `RUN npm ci` before `COPY . .` — caches node_modules layer
- `npm ci` (not `npm install`) for reproducible installs from lockfile
- After adding/changing deps locally, run `npm install` to regenerate `package-lock.json`, then commit it

---

## 7. Frontend — `FrontEnd/nginx.conf`

nginx serves the React SPA and **proxies API calls to the Django backend** by hostname (`backend` = the Docker service name).

```nginx
server {
    listen 80;

    # Serve the React SPA
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to Django
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy media files (uploads)
    location /media/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy Django admin
    location /admin/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> This is why `VITE_API_URL` can be empty — the browser hits `/api/` on the same origin and nginx forwards it.

---

## 8. `docker-compose.yml`

Three services: `db` (PostgreSQL), `backend` (Django/gunicorn), `frontend` (nginx).

```yaml
services:

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-cinema_db}
      POSTGRES_USER: ${DB_USER:-cinema_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-cinema_pass}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-cinema_user} -d ${DB_NAME:-cinema_db}"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build: ./BackEnd
    restart: unless-stopped
    env_file: .env              # reads your .env file
    environment:
      DB_HOST: db               # override — points to the db service
      DB_PORT: "5432"
    depends_on:
      db:
        condition: service_healthy   # waits until postgres passes healthcheck
    volumes:
      - media_data:/app/media

  frontend:
    build: ./FrontEnd
    restart: unless-stopped
    ports:
      - "80:80"                 # change to "8080:80" if port 80 is taken locally
    depends_on:
      - backend

volumes:
  postgres_data:
  media_data:
```

> ⚠️ **Stale volume problem:** If you change `DB_USER`/`DB_PASSWORD` after the volume already exists, PostgreSQL ignores them. Fix: `docker compose down -v` to wipe volumes and start fresh.

---

## 9. The `.env` file

**Never commit `.env` to git.** Commit `.env.example` instead.

### `.env` (local — gitignored)
```env
# Django
SECRET_KEY=your-long-random-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost

# PostgreSQL
DB_NAME=cinema_db
DB_USER=cinema_user
DB_PASSWORD=a-strong-password

# Admin account (auto-created on first boot)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=a-strong-admin-password

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# TMDB
TMDB_API_KEY=your_tmdb_api_key
```

### `.env.example` (committed to git)
Same file but with placeholder values, no real secrets.

### Generate a Django SECRET_KEY
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## 10. `.gitignore` additions

Make sure these are ignored:

```
.env
*.pyc
__pycache__/
BackEnd/staticfiles/
BackEnd/media/
FrontEnd/node_modules/
FrontEnd/dist/
```

---

## 11. GitHub Actions Workflows

### `ci.yml` — runs on every push/PR

Tests the backend and lint+builds the frontend.

```yaml
name: CI
on:
  push:
    branches: ["**"]
  pull_request:
    branches: ["**"]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
          cache-dependency-path: BackEnd/requirements.txt
      - run: pip install -r requirements.txt
        working-directory: BackEnd
      - run: pytest -q
        working-directory: BackEnd
        env:
          DJANGO_SETTINGS_MODULE: cinema_backend.settings_test
          SECRET_KEY: ci-insecure-key-for-tests-only

  frontend-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
          cache-dependency-path: FrontEnd/package-lock.json
      - run: npm ci
        working-directory: FrontEnd
      - run: npm run lint
        working-directory: FrontEnd
      - run: npm run build
        working-directory: FrontEnd
        env:
          VITE_API_URL: ""
```

> You need a `settings_test.py` for CI that uses SQLite so no DB is needed. Example:
> ```python
> from .settings import *
> DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:'}}
> ```

---

### `docker-build.yml` — validates Docker builds on every PR

```yaml
name: Docker Build Check
on:
  pull_request:
    branches: [master, main]

jobs:
  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with:
          context: ./BackEnd
          push: false
          tags: myapp-backend:pr-${{ github.event.number }}

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with:
          context: ./FrontEnd
          push: false
          tags: myapp-frontend:pr-${{ github.event.number }}
```

---

### `release.yml` — publishes Docker images to GHCR on merge to master

Triggers after CI passes. Pushes images to GitHub Container Registry and creates a GitHub Release with auto-incremented version tags (`v1.0.0`, `v1.0.1`, ...).

**Required GitHub secret:** `GITHUB_TOKEN` (automatic — no setup needed).

The images will be published at:
```
ghcr.io/YOUR_USERNAME/myapp-backend:latest
ghcr.io/YOUR_USERNAME/myapp-frontend:latest
```

---

### `deploy.yml` — deploys to DigitalOcean App Platform on merge to master

**Required GitHub Secrets (set in repo Settings → Secrets):**

| Secret | Where to get it |
|--------|----------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | [DigitalOcean API tokens](https://cloud.digitalocean.com/account/api/tokens) |
| `DO_REGISTRY_NAME` | Your DOCR registry name (e.g. `myregistry`) |
| `DO_APP_ID` | App Platform app ID (leave empty to auto-create on first deploy) |

---

### `security.yml` — weekly vulnerability scan

Runs `pip-audit` (backend) and `npm audit` (frontend) every Monday. If vulnerabilities are found, it automatically opens a GitHub Issue labeled `security`.

No secrets required.

---

### `codeql.yml` — static code analysis

Runs CodeQL on Python and JavaScript on every push to master/main, and weekly.

No secrets required.

---

## 12. Running Locally (step by step)

```bash
# 1. Clone the monorepo
git clone https://github.com/you/your-project.git
cd your-project

# 2. Create your .env from the template
cp .env.example .env
# Then edit .env and fill in real values

# 3. Build images
docker compose build

# 4. Start everything
docker compose up -d

# 5. Check logs
docker compose logs backend --tail=30
docker compose logs frontend --tail=10

# 6. Open the app
# http://localhost (or http://localhost:8080 if port 80 is taken)
```

---

## 13. Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `psycopg2 compile error (gcc not found)` | Using `psycopg2` source package | Use `psycopg2-binary` in requirements.txt |
| `gunicorn: not found` | Missing from requirements.txt | Add `gunicorn>=21.0.0` |
| `STATIC_ROOT not set` | Missing from settings.py | Add `STATIC_ROOT = BASE_DIR / 'staticfiles'` |
| `password authentication failed` | Stale postgres volume with old credentials | Run `docker compose down -v` to wipe volumes |
| `npm ci` fails (missing packages) | package-lock.json out of sync with package.json | Run `npm install` locally to regenerate lockfile, then commit it |
| Backend stuck "PostgreSQL not ready" | Wrong DB_HOST (should be `db`, not `localhost`) | Check `docker-compose.yml` sets `DB_HOST: db` |
| Port 80 already in use | Something else running on port 80 | Change to `"8080:80"` in docker-compose.yml |
| Frontend shows old version | Docker layer cache | Run `docker compose build --no-cache` |

---

## 14. Useful Commands

```bash
# Rebuild a single service
docker compose build backend

# Restart a single service without rebuilding
docker compose restart backend

# Wipe everything (volumes too) and start fresh
docker compose down -v && docker compose up -d

# Run Django management commands
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py migrate

# Open a shell inside a container
docker compose exec backend sh
docker compose exec db psql -U cinema_user -d cinema_db

# View all logs live
docker compose logs -f
```
