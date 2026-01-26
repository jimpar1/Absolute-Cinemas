# API Documentation - Τεκμηρίωση API

Αυτό το αρχείο παρέχει γρήγορη αναφορά για τα API endpoints.
This file provides quick reference for API endpoints.

## Base URL
```
http://127.0.0.1:8000/api/
```

## Endpoints Overview

### Movies API
- **GET** `/api/movies/` - Λίστα ταινιών
- **GET** `/api/movies/{id}/` - Λεπτομέρειες ταινίας
- **POST** `/api/movies/` - Δημιουργία ταινίας
- **PUT** `/api/movies/{id}/` - Ενημέρωση ταινίας
- **PATCH** `/api/movies/{id}/` - Μερική ενημέρωση
- **DELETE** `/api/movies/{id}/` - Διαγραφή ταινίας
- **GET** `/api/movies/{id}/screenings/` - Προβολές ταινίας

### Screenings API
- **GET** `/api/screenings/` - Λίστα προβολών
- **GET** `/api/screenings/{id}/` - Λεπτομέρειες προβολής
- **POST** `/api/screenings/` - Δημιουργία προβολής
- **PUT** `/api/screenings/{id}/` - Ενημέρωση προβολής
- **PATCH** `/api/screenings/{id}/` - Μερική ενημέρωση
- **DELETE** `/api/screenings/{id}/` - Διαγραφή προβολής
- **GET** `/api/screenings/{id}/bookings/` - Κρατήσεις προβολής

### Bookings API
- **GET** `/api/bookings/` - Λίστα κρατήσεων
- **GET** `/api/bookings/{id}/` - Λεπτομέρειες κράτησης
- **POST** `/api/bookings/` - Δημιουργία κράτησης
- **PUT** `/api/bookings/{id}/` - Ενημέρωση κράτησης
- **PATCH** `/api/bookings/{id}/` - Μερική ενημέρωση
- **DELETE** `/api/bookings/{id}/` - Διαγραφή κράτησης

## Query Parameters

### Search (Αναζήτηση)
```
?search={query}
```

### Filtering (Φιλτράρισμα)
```
?field={value}
Παράδειγμα: ?status=confirmed&screening=1
```

### Ordering (Ταξινόμηση)
```
?ordering={field}
?ordering=-{field}  (φθίνουσα σειρά)
```

### Pagination
```
?page={number}
?page_size={number}
```

## Example Requests

### Create Movie
```bash
curl -X POST http://127.0.0.1:8000/api/movies/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Inception",
    "description": "Ένα sci-fi thriller για τα όνειρα",
    "duration": 148,
    "genre": "Sci-Fi",
    "director": "Christopher Nolan",
    "release_year": 2010,
    "rating": 8.8
  }'
```

### Create Screening
```bash
curl -X POST http://127.0.0.1:8000/api/screenings/ \
  -H "Content-Type: application/json" \
  -d '{
    "movie": 1,
    "screen_number": 1,
    "start_time": "2025-10-20T20:00:00Z",
    "end_time": "2025-10-20T22:30:00Z",
    "available_seats": 150,
    "total_seats": 150,
    "price": "12.50"
  }'
```

### Create Booking
```bash
curl -X POST http://127.0.0.1:8000/api/bookings/ \
  -H "Content-Type: application/json" \
  -d '{
    "screening": 1,
    "customer_name": "Μαρία Γεωργίου",
    "customer_email": "maria@example.com",
    "customer_phone": "6987654321",
    "seats_booked": 3,
    "status": "confirmed"
  }'
```

## Response Format

Όλα τα responses είναι σε JSON format με pagination:

```json
{
  "count": 10,
  "next": "http://127.0.0.1:8000/api/movies/?page=2",
  "previous": null,
  "results": [...]
}
```

## Error Handling

Σε περίπτωση σφάλματος, το API επιστρέφει κατάλληλο HTTP status code και περιγραφή:

- `400 Bad Request` - Λανθασμένα δεδομένα
- `404 Not Found` - Το resource δεν βρέθηκε
- `500 Internal Server Error` - Σφάλμα server

```json
{
  "field_name": ["Error message"]
}
```
