# Absolute Cinema (Frontend)

Single‑page εφαρμογή κρατήσεων σινεμά (React + Vite) με:

- browsing ταινιών (Now Playing / Upcoming)
- movie details με screenings
- πλήρη ροή κράτησης (multi‑step) με seat locking
- Auth (login/register), Profile, αλλαγή κωδικού
- Watchlist + local reservations timer

> Σημείωση: Το repo αυτό είναι **frontend**. Περιμένει Django backend API (REST) να τρέχει ξεχωριστά.

## Περιεχόμενα

- [Γρήγορη εκκίνηση](#γρήγορη-εκκίνηση)
- [4. Αρχιτεκτονική συστήματος](#4-αρχιτεκτονική-συστήματος)
- [5. Front-end (SPA)](#5-front-end-spa)
- [Ρoutes / Σελίδες](#routes--σελίδες)
- [Ρυθμίσεις περιβάλλοντος](#ρυθμίσεις-περιβάλλοντος)
- [Backend API (Django) – σύμβαση endpoints](#backend-api-django--σύμβαση-endpoints)
- [Κύριες ροές](#κύριες-ροές)
- [Δομή φακέλων](#δομή-φακέλων)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

## Γρήγορη εκκίνηση

### Προαπαιτούμενα

- Node.js 18+ (συνιστάται 20+)
- npm

### 1) Εγκατάσταση

```bash
npm install
```

### 2) Environment variables

Υπάρχει ήδη αρχείο [.env](.env) με default backend:

```dotenv
VITE_API_URL=http://localhost:8000
```


### 3) Εκκίνηση (dev)

```bash
npm run dev
```

Η εφαρμογή ανοίγει στο `http://localhost:5173`.

### 4) Production build / preview

```bash
npm run build
npm run preview
```

## 4. Αρχιτεκτονική συστήματος

Η λύση ακολουθεί **3‑tier αρχιτεκτονική** (front‑end, business logic, database), όπως απαιτείται.

### 4.1 Επίπεδα (3‑tier)

1) **Front‑end (Presentation Layer)**
- Υλοποίηση: React SPA (Vite) που τρέχει στον browser.
- Ευθύνη: UI/UX, πλοήγηση, φόρμες, εμφάνιση δεδομένων, client‑side κατάσταση (watchlist/reservations), και κλήσεις στο API.

2) **Business Logic (Application Layer / API)**
- Υλοποίηση (αναμενόμενη): Django (Python, αντικειμενοστρεφής γλώσσα) + REST API (π.χ. Django REST Framework).
- Ευθύνη: κανόνες κράτησης, έλεγχοι εγκυρότητας, authentication/authorization, ανάκτηση/μετασχηματισμός δεδομένων, και συντονισμός των operations (π.χ. seat locking, δημιουργία booking).

3) **Database (Data Layer)**
- Τύπος: **σχεσιακή βάση δεδομένων** (RDBMS).
- Πρόσβαση: το business logic επικοινωνεί με τη βάση **μέσω ORM** (αναμενόμενο: Django ORM).

> Το συγκεκριμένο repository περιέχει το **front‑end**. Το backend/DB υλοποιούνται ως ξεχωριστή υπηρεσία, στην οποία συνδέεται το SPA μέσω `VITE_API_URL`.

### 4.2 Επικοινωνία Front‑end ↔ Business Logic (REST)

Ο περιορισμός “RESTful web services” καλύπτεται ως εξής:

- Το front‑end καλεί endpoints τύπου `GET/POST/PATCH` κάτω από `${VITE_API_URL}/api/...`.
- Payloads σε JSON.
- Auth: JWT access token σε header `Authorization: Bearer <token>` όπου απαιτείται.
- Συμβάσεις endpoints περιγράφονται στην ενότητα [Backend API (Django) – σύμβαση endpoints](#backend-api-django--σύμβαση-endpoints).

### 4.3 Business Logic + ORM + Σχεσιακή ΒΔ

Ο περιορισμός “ORM πάνω από σχεσιακή βάση” καλύπτεται τυπικά από:

- **Django ORM** για mapping πινάκων ↔ αντικειμένων (models).
- Σχεσιακές σχέσεις όπως:
  - Movie 1‑N Screenings
  - Screening 1‑N Bookings
  - User 1‑N Bookings

Ενδεικτικές οντότητες (domain objects) που φαίνονται από τα δεδομένα που καταναλώνει το front‑end:

- **Movie**: τίτλος, περιγραφή, poster/backdrop, status (now_playing/upcoming), (προαιρετικά) tmdb_id
- **Screening**: start_time, hall/hall_layout, price_per_seat, movie
- **Booking**: screening, customer info, seat_numbers, total_price, status
- **SeatLock** (ή ισοδύναμος μηχανισμός): map seat → session_id για προσωρινό αποκλεισμό θέσεων

### 4.4 Concurrency: Seat locking

Για να μη “κλείνουν” δύο χρήστες την ίδια θέση ταυτόχρονα, η εφαρμογή χρησιμοποιεί **seat locking** στο επίπεδο business logic:

- Κατά την επιλογή θέσης (step 1) το front‑end καλεί `lock_seats` με `session_id`.
- Κατά την αποεπιλογή ή στην έξοδο από τη σελίδα, καλεί `unlock_seats`.
- Το UI ενημερώνεται με συνδυασμό:
  - booked seats από `GET /screenings/{id}/bookings/`
  - locked seats από `GET /screenings/{id}/locked_seats/`

### 4.5 Διάγραμμα υψηλού επιπέδου

```mermaid
flowchart LR
  U[Χρήστης / Browser]
  FE[React SPA (Vite)
  Presentation Layer]
  BE[Django REST API
  Business Logic]
  DB[(Relational DB
  via ORM)]

  U --> FE
  FE -- "REST/JSON + JWT" --> BE
  BE -- "ORM" --> DB
```

## 5. Front-end (SPA)

Το front‑end υλοποιείται ως **Single Page Application**.

### 5.1 Framework & tooling

- Framework: **React**
- Build tool / dev server: **Vite**
- Routing: **React Router**

### 5.2 Πλοήγηση & routing

- Το SPA χρησιμοποιεί client‑side routing (χωρίς full page reload).
- Τα routes ορίζονται στο [src/App.jsx](src/App.jsx) (βλ. ενότητα [Routes / Σελίδες](#routes--σελίδες)).

### 5.3 Διαχείριση κατάστασης (state)

- **Auth state** (user + tokens) μέσω Context: [src/context/AuthContext.jsx](src/context/AuthContext.jsx)
  - αποθήκευση σε `localStorage`
  - JWT refresh όταν υπάρχει refresh token
- **Reservation/Watchlist state** μέσω Context: [src/context/ReservationContext.jsx](src/context/ReservationContext.jsx)
  - watchlist σε `localStorage`
  - reservations με timeout 10 λεπτών
  - `sessionStorage` για per‑tab booking `sessionId`

### 5.4 Επικοινωνία με backend

- Η επικοινωνία γίνεται με `fetch` wrappers στον φάκελο [src/api/](src/api/).
- To base URL παραμετροποιείται από `VITE_API_URL` (βλ. [Ρυθμίσεις περιβάλλοντος](#ρυθμίσεις-περιβάλλοντος)).

### 5.5 UI / Components

- Styling: Tailwind CSS
- UI primitives: Radix‑based components (shadcn/ui‑style) στον φάκελο [src/components/ui/](src/components/ui/)
- Reusable components ανά feature (booking/movie/movies/navigation).

## Routes / Σελίδες

Οι βασικές διαδρομές ορίζονται στο [src/App.jsx](src/App.jsx):

- `/` → Home (hero + Swiper slider + tabs Now Playing / Upcoming)
- `/movies` → Movies (tabs Now Playing / Upcoming / Watchlist + φίλτρα)
- `/movies/:id` → MovieDetails (gallery, screenings calendar, trailer, sidebar)
- `/booking/:id` → Booking (multi‑step κράτηση για screening)
- `/about` → About Us (custom “team” page)
- `/profile` → Profile (bookings, προσωπικά στοιχεία, αλλαγή κωδικού)

## Ρυθμίσεις περιβάλλοντος

### `VITE_API_URL`

- Χρησιμοποιείται ως base URL για το backend API.
- Default: `http://localhost:8000`
- Αν το backend έχει trailing slash, δεν υπάρχει πρόβλημα (γίνεται normalize).

Παράδειγμα:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

## Backend API (Django) – σύμβαση endpoints

Το frontend καλεί endpoints κάτω από `${VITE_API_URL}/api/...`.

### Movies

Χρησιμοποιούνται από [src/api/movies.js](src/api/movies.js):

- `GET /api/movies/` → λίστα (συνήθως paginated: `{ count, next, previous, results }`)
- `GET /api/movies/{id}/` → λεπτομέρειες
- `GET /api/movies/{id}/screenings/` → screenings για τη συγκεκριμένη ταινία

Υπάρχουν επίσης helpers για TMDB proxy (αν το backend τα παρέχει):

- `GET /api/movies/search_tmdb/?query=...&page=...`
- `GET /api/movies/popular_tmdb/?page=...`
- `GET /api/movies/tmdb_details/?movie_id=...`

### Screenings

Χρησιμοποιούνται από [src/api/screenings.js](src/api/screenings.js):

- `GET /api/screenings/{id}/` → screening details (start_time, hall_layout, price_per_seat κ.ά.)

### Bookings + Seat locking

Χρησιμοποιούνται από [src/api/bookings.js](src/api/bookings.js) και τη σελίδα booking:

- `POST /api/bookings/` → δημιουργία κράτησης
- `GET /api/bookings/` → bookings χρήστη (απαιτεί auth)
- `GET /api/screenings/{id}/bookings/` → κλεισμένες/αγορασμένες θέσεις
- `POST /api/screenings/{id}/lock_seats/` → lock θέσεων (body: `{ seat_numbers, session_id }`)
- `POST /api/screenings/{id}/unlock_seats/` → unlock θέσεων (body: `{ seat_numbers, session_id }` ή beacon μόνο `{ session_id }`)
- `GET /api/screenings/{id}/locked_seats/` → map κλειδωμένων θέσεων (π.χ. `{ "A1": "session-uuid" }`)

### Auth (JWT)

Χρησιμοποιούνται από [src/api/auth.js](src/api/auth.js) + [src/context/AuthContext.jsx](src/context/AuthContext.jsx):

- `POST /api/auth/login/` → επιστρέφει access/refresh (+ user)
- `POST /api/auth/register/` → δημιουργία λογαριασμού
- `POST /api/auth/logout/` → blacklist refresh (αν υποστηρίζεται)
- `GET /api/auth/profile/` → προφίλ
- `PATCH /api/auth/profile/` → ενημέρωση προφίλ
- `POST /api/auth/change-password/` (ή fallback `POST /api/auth/password/change/`) → αλλαγή κωδικού
- `POST /api/token/refresh/` → refresh access token

## Κύριες ροές

### Intro video

- Εμφανίζεται στην πρώτη επίσκεψη.
- Αποθηκεύεται flag `hasSeenIntro` σε `localStorage`.
- Υπάρχει κουμπί replay στο navigation.

### Watchlist + Reservations

Υλοποιούνται στο [src/context/ReservationContext.jsx](src/context/ReservationContext.jsx):

- **Watchlist** αποθηκεύεται σε `localStorage` (`watchlist`).
- **Seat reservations** αποθηκεύονται σε `localStorage` (`reservations`) και λήγουν μετά από 10 λεπτά.

### Booking flow (multi‑step)

Η σελίδα [src/pages/Booking.jsx](src/pages/Booking.jsx) υλοποιεί 4 βήματα:

1. Seat selection (με real‑time locks)
2. Contact form
3. Payment form (UI μόνο)
4. Confirmation

Τεχνικά σημεία:

- Δημιουργείται `sessionId` ανά tab και screening (σε `sessionStorage`) για να “ξεχωρίζει” τα locks.
- Σε `beforeunload` γίνεται beacon σε `unlock_seats` ώστε να ελευθερώνονται locks αν κλείσει το tab.

### Authentication + Profile + Change password

- Login / Register γίνονται μέσω dialogs από το navigation.
- Tokens + user αποθηκεύονται σε `localStorage`.
- Το Profile έχει tabs: Bookings, Profile, Security (change password).

## Δομή φακέλων

```text
public/
  original_images/         # static assets
  team/                    # photos για About Us

src/
  api/                     # fetch wrappers προς Django API
    auth.js
    bookings.js
    movies.js
    screenings.js

  components/
    booking/               # multi-step booking UI
    movie/                 # MovieDetails sub-components
    movies/                # filters + grid για Movies page
    navigation/            # inbox + reservation timer
    ui/                    # shadcn/ui-style primitives (Radix)

  context/
    AuthContext.jsx
    ReservationContext.jsx

  hooks/
    use-toast.js

  lib/
    utils.js               # cn() + helpers

  pages/
    Home.jsx
    Movies.jsx
    MovieDetails.jsx
    Booking.jsx
    AboutUs.jsx
    Profile.jsx

  utils/
    calendar.js
    image.js
    youtube.js
```

## Scripts

Ορίζονται στο [package.json](package.json):

- `npm run dev` → Vite dev server
- `npm run build` → production build
- `npm run preview` → preview του build
- `npm run lint` → ESLint