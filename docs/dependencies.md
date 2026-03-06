# Εξαρτήσεις

## Backend (Python / Django)

| Πακέτο | Έκδοση | Σκοπός |
|--------|--------|--------|
| `Django` | >=5.1 | Web framework — ORM, admin, middleware, δρομολόγηση URL |
| `djangorestframework` | >=3.14.0 | Toolkit REST API — serializers, ViewSets, σελιδοποίηση, permissions |
| `djangorestframework-simplejwt` | >=5.3.0 | Αυθεντικοποίηση JWT — access/refresh tokens, blacklisting |
| `django-cors-headers` | >=4.3.0 | Middleware CORS — επιτρέπει στο frontend να καλεί το API |
| `django-filter` | >=23.0 | Φιλτράρισμα με παραμέτρους URL σε ViewSets (είδος, κατάσταση, ημερομηνία) |
| `dependency-injector` | >=4.41.0 | Dependency injection container — αποσυνδέει services από views |
| `tmdbv3api` | >=1.9.0 | TMDB API client — ανάκτηση μεταδεδομένων ταινιών, αφίσες, trailers, cast |
| `stripe` | >=8.0.0 | Stripe Python SDK — PaymentIntents, Checkout Sessions, webhooks |
| `whitenoise` | >=6.7 | Εξυπηρέτηση Django static files χωρίς ξεχωριστό static server |
| `gunicorn` | >=22.0 | Production WSGI server — αντικαθιστά τον dev server του Django σε Docker |
| `psycopg2-binary` | >=2.9 | PostgreSQL driver — adapter Django ORM για PostgreSQL |
| `python-dotenv` | latest | Φόρτωση αρχείου `.env` σε μεταβλητές περιβάλλοντος για τοπική ανάπτυξη |

### Ανάπτυξη / Δοκιμές

| Πακέτο | Έκδοση | Σκοπός |
|--------|--------|--------|
| `pytest` | >=8.0.0 | Test runner |
| `pytest-django` | >=4.8.0 | Ενσωμάτωση Django για pytest (test DB, fixtures, settings) |
| `pytest-cov` | >=5.0.0 | Αναφορά κάλυψης δοκιμών |

---

## Frontend (Node / React)

### Εξαρτήσεις παραγωγής

| Πακέτο | Έκδοση | Σκοπός |
|--------|--------|--------|
| `react` | ^19.2.0 | UI library |
| `react-dom` | ^19.2.0 | DOM renderer για React |
| `react-router-dom` | ^7.10.1 | Client-side routing (SPA πλοήγηση) |
| `tailwindcss` | ^4.1.17 | Utility-first CSS framework |
| `gsap` | ^3.14.2 | Βιβλιοθήκη animations υψηλής απόδοσης (μεταβάσεις σελίδων, scroll effects) |
| `lenis` | ^1.3.17 | Βιβλιοθήκη smooth scroll — χρησιμοποιείται μαζί με GSAP ScrollTrigger |
| `swiper` | ^12.1.2 | Carousel με touch υποστήριξη — για αφίσες ταινιών και gallery |
| `lucide-react` | ^0.556.0 | Βιβλιοθήκη εικονιδίων (SVG icons ως React components) |
| `clsx` | ^2.1.1 | Βοηθητικό για conditional className strings |
| `tailwind-merge` | ^3.4.0 | Συγχώνευση Tailwind classes χωρίς συγκρούσεις στυλ |
| `class-variance-authority` | ^0.7.1 | Typed component variant API (χρησιμοποιείται με Tailwind) |
| `@stripe/react-stripe-js` | ^5.6.1 | React components Stripe (Elements, PaymentElement) |
| `@stripe/stripe-js` | ^8.9.0 | Browser SDK Stripe — φορτώνει το Stripe με ασφάλεια |

### Radix UI (unstyled accessible components)

| Πακέτο | Έκδοση | Σκοπός |
|--------|--------|--------|
| `@radix-ui/react-checkbox` | ^1.3.3 | Προσβάσιμο checkbox |
| `@radix-ui/react-dialog` | ^1.1.15 | Modal/dialog |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | Dropdown menus |
| `@radix-ui/react-navigation-menu` | ^1.2.14 | Navigation menu |
| `@radix-ui/react-select` | ^2.2.6 | Select dropdown |
| `@radix-ui/react-separator` | ^1.1.8 | Οριζόντιος/κατακόρυφος διαχωριστής |
| `@radix-ui/react-slot` | ^1.2.4 | Composition primitive |
| `@radix-ui/react-tabs` | ^1.1.13 | Tab panels |
| `@radix-ui/react-toast` | ^1.2.15 | Toast ειδοποιήσεις |

### Εξαρτήσεις ανάπτυξης

| Πακέτο | Έκδοση | Σκοπός |
|--------|--------|--------|
| `vite` | ^7.2.4 | Build tool και dev server frontend |
| `@vitejs/plugin-react` | ^5.1.1 | Vite plugin για React (JSX, HMR) |
| `@tailwindcss/postcss` | ^4.1.17 | Ενσωμάτωση PostCSS για Tailwind |
| `postcss` | ^8.5.6 | CSS post-processor |
| `autoprefixer` | ^10.4.22 | Αυτόματη προσθήκη vendor prefixes στο CSS |
| `eslint` | ^9.39.1 | JavaScript/JSX linter |
| `eslint-plugin-react-hooks` | ^7.0.1 | Επιβολή κανόνων React Hooks |
| `eslint-plugin-react-refresh` | ^0.4.24 | Επαλήθευση components για HMR compatibility |
| `eslint-plugin-jsx-a11y` | ^6.10.2 | Linting προσβασιμότητας για JSX (υποστήριξη WCAG AA) |
| `@types/react` | ^19.2.5 | TypeScript types για React (χρησιμοποιούνται από IDEs) |
| `@types/react-dom` | ^19.2.3 | TypeScript types για React DOM |
| `globals` | ^16.5.0 | Ορισμοί global μεταβλητών για ESLint |

---

## Εξωτερικές Υπηρεσίες

| Υπηρεσία | Χρήση |
|---------|-------|
| **TMDB** (The Movie Database) | Μεταδεδομένα ταινιών — αφίσες, trailers, cast, είδη. Απαιτείται δωρεάν API key. |
| **Stripe** | Επεξεργασία πληρωμών — πληρωμές κρατήσεων και συνδρομές CinemaPass. Διαθέσιμο test mode. |
| **PostgreSQL** | Σχεσιακή βάση δεδομένων. Δωρεάν tier διαθέσιμο σε Railway, Render, Supabase και Neon. |
