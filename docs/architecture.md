# Architecture

## Overview

AbsoluteCinema follows a **3-tier architecture** with each tier containerized independently.

```mermaid
flowchart TD
    Browser["Browser (React SPA)"]
    Nginx["nginx:alpine\nPort 80\nServes static build\nProxies /api/ and /media/"]
    Django["Django 5 + Gunicorn\nPort 8000\nREST API + Business Logic"]
    PG["PostgreSQL 16\nPort 5432\nPersistent data"]

    Browser -->|HTTP| Nginx
    Nginx -->|proxy_pass /api/| Django
    Nginx -->|proxy_pass /media/| Django
    Django -->|Django ORM| PG

    style Nginx fill:#009900,color:#fff
    style Django fill:#092e20,color:#fff
    style PG fill:#336791,color:#fff
```

| Tier | Technology | Responsibility |
|------|-----------|---------------|
| Presentation | React 19 + Vite + Tailwind | UI rendering, client-side routing, API calls |
| Business Logic | Django 5 + DRF + Gunicorn | REST API, authentication, booking logic, Stripe integration |
| Data | PostgreSQL 16 | Persistent storage, relational integrity |

---

## Data Models (Entity-Relationship)

```mermaid
erDiagram
    User {
        int id
        string username
        string email
        string password
        bool is_staff
        bool is_superuser
    }
    Customer {
        int id
        string phone
        datetime created_at
        datetime updated_at
    }
    Movie {
        int id
        string title
        text description
        int duration
        string genre
        string director
        int release_year
        decimal rating
        string status
        url poster_url
        url trailer_url
        json shots
        json actors
    }
    MovieHall {
        int id
        string name
        int capacity
        int left_section_capacity
        int middle_section_capacity
        int right_section_capacity
        int balcony_middle_capacity
        json layout
    }
    HallPhoto {
        int id
        string image
        int order
    }
    Screening {
        int id
        datetime start_time
        decimal price
        int available_seats
    }
    Booking {
        int id
        string customer_name
        string customer_email
        string customer_phone
        int seats_booked
        string seat_numbers
        decimal total_price
        string status
        string payment_status
        string stripe_payment_intent_id
        datetime booking_date
    }
    SeatLock {
        int id
        string seat_number
        string session_id
        datetime created_at
    }
    Subscription {
        int id
        int free_tickets_used
        string stripe_checkout_session_id
        string stripe_customer_id
    }

    User ||--o| Customer : "has profile"
    User ||--o| Subscription : "has subscription"
    User ||--o{ Booking : "creates"
    Movie ||--o{ Screening : "shown in"
    MovieHall ||--o{ Screening : "hosts"
    MovieHall ||--o{ HallPhoto : "has photos"
    Screening ||--o{ Booking : "has bookings"
    Screening ||--o{ SeatLock : "has locks"
```

---

## Backend Structure

```
BackEnd/
├── cinema_backend/         Django project config
│   ├── settings.py         All settings (reads from env vars)
│   ├── urls.py             Root URL routing
│   ├── wsgi.py             WSGI entry point (Gunicorn)
│   └── settings_test.py    Test settings (SQLite in-memory)
└── cinema/                 Main application
    ├── models/             ORM models (Movie, Screening, Booking, etc.)
    ├── views/              ViewSets and API views
    ├── serializers/        DRF serializers
    ├── services/           Business logic layer
    ├── repositories.py     Data access layer
    ├── container.py        Dependency injection (dependency-injector)
    ├── permissions.py      Custom DRF permissions (RBAC)
    ├── auth_views.py       Authentication endpoints
    ├── tmdb_service.py     TMDB API integration
    └── management/
        └── commands/
            ├── bootstrap_accounts.py   Create admin/staff users
            ├── seed_db.py              Seed halls, photos, movies
            └── refresh_movies_from_tmdb.py
```

The backend uses the **Repository + Service + Controller** pattern with Dependency Injection to separate concerns:

- **Controllers** (views/) — handle HTTP, validate input, call services
- **Services** (services/) — business rules, orchestration
- **Repositories** (repositories.py) — database queries via Django ORM

---

## Frontend Structure

```
FrontEnd/src/
├── api/            Backend API client functions (one file per resource)
│   ├── auth.js     Authentication calls
│   ├── movies.js   Movie listing and detail
│   ├── bookings.js Booking creation and retrieval
│   ├── halls.js    Hall data
│   ├── screenings.js
│   ├── payments.js Stripe integration
│   └── subscription.js
├── components/     Reusable UI components (Radix UI based)
├── context/        React context (AuthContext, etc.)
├── hooks/          Custom React hooks
├── pages/          Route-level page components
├── utils/          Utility functions
└── lib/            Third-party wrappers (GSAP, etc.)
```

All API calls use `import.meta.env.VITE_API_URL` as the base URL (empty in Docker = same origin, proxied by nginx).

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Nginx
    participant Django
    participant DB

    Browser->>Nginx: POST /api/auth/login/
    Nginx->>Django: proxy
    Django->>DB: Validate credentials
    DB-->>Django: User record
    Django-->>Browser: { access, refresh }

    Browser->>Nginx: GET /api/movies/ (Authorization: Bearer <access>)
    Nginx->>Django: proxy
    Django->>Django: Validate JWT
    Django->>DB: Query movies
    DB-->>Django: Results
    Django-->>Browser: Paginated movie list
```
