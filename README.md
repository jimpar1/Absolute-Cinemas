# AbsoluteCinema — Frontend

## Τι είναι

React SPA για αναζήτηση ταινιών, επιλογή θέσεων και κράτηση εισιτηρίων. Συνδέεται με το Django backend μέσω REST API και υποστηρίζει πληρωμές μέσω Stripe.

---

## Τεχνολογίες

| Τεχνολογία | Χρήση |
|------------|-------|
| React 19 | UI framework |
| Vite | Build tool / dev server |
| React Router 7 | Client-side routing |
| Tailwind CSS | Styling |
| GSAP | Animations |
| Stripe.js | Πληρωμές |
| Radix UI | Accessible UI components |

---

## Προαπαιτούμενα

- Node.js 18+
- npm

---

## Εγκατάσταση

```bash
git clone <repo-url>
cd AbsoluteCinema

npm install
```

---

## Ρύθμιση περιβάλλοντος

| | Windows | Linux / macOS |
|---|---------|---------------|
| Αντιγραφή .env | `copy .env.example .env` | `cp .env.example .env` |

Επεξεργαστείτε το `.env`:

| Κλειδί | Περιγραφή |
|--------|-----------|
| `VITE_API_URL` | URL του backend (π.χ. `http://127.0.0.1:8000`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

---

## Εκτέλεση

```bash
# Development server
npm run dev

# Production build
npm run build
```

Ο dev server εκκινεί στο `http://localhost:5173/`.

---

## Σελίδες & λειτουργίες

| Σελίδα | Λειτουργία |
|--------|------------|
| **Home** | Προβολή featured ταινιών, animated intro |
| **Ταινίες** | Αναζήτηση και φιλτράρισμα ταινιών |
| **Λεπτομέρειες ταινίας** | Πληροφορίες, trailer, διαθέσιμες προβολές |
| **Κράτηση** | 4-βηματική διαδικασία κράτησης εισιτηρίου |
| **Προφίλ** | Ιστορικό κρατήσεων, κατάσταση συνδρομής |
| **Σχετικά μαζί μας** | Πληροφορίες για την ομάδα |

---

## Κράτηση εισιτηρίων

Η διαδικασία κράτησης γίνεται σε 4 βήματα:

1. **Επιλογή θέσης** — διαδραστικό χάρτης αίθουσας με διαθέσιμες/κατειλημμένες θέσεις
2. **Στοιχεία κράτησης** — επιβεβαίωση επιλογής και ανακεφαλαίωση
3. **Πληρωμή Stripe** — ασφαλής πληρωμή μέσω Stripe Elements
4. **Επιβεβαίωση** — εμφάνιση επιβεβαίωσης κράτησης

---

## Αυθεντικοποίηση

- JWT tokens (access + refresh) αποθηκευμένα στο localStorage
- Σύνδεση και εγγραφή μέσω modal (χωρίς redirect σε ξεχωριστή σελίδα)
- Αυτόματη ανανέωση access token μέσω interceptor

---

## Σύνδεση με backend

Όλες οι κλήσεις API βρίσκονται στον φάκελο `src/api/`. Το base URL ορίζεται από τη μεταβλητή `VITE_API_URL` στο `.env`.

```
src/api/
  auth.js        — σύνδεση, εγγραφή, refresh token
  movies.js      — ταινίες
  screenings.js  — προβολές και θέσεις
  bookings.js    — κρατήσεις
  payments.js    — Stripe intents
  subscription.js — συνδρομές
```
