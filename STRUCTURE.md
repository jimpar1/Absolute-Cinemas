# Cinema Django Backend - Δομή Αρχείων / File Structure

## Περιγραφή / Description

Αυτό το αρχείο περιγράφει την πλήρη δομή του project και το σκοπό κάθε αρχείου.
This file describes the complete structure of the project and the purpose of each file.

## Δομή Project / Project Structure

```
Cinema-Django-Backend/
│
├── .gitignore                    # Αρχεία που αγνοούνται από το Git
│
├── README.md                     # Κύριο αρχείο τεκμηρίωσης με οδηγίες εγκατάστασης
│
├── API_DOCS.md                   # Γρήγορη αναφορά για τα API endpoints
│
├── STRUCTURE.md                  # Αυτό το αρχείο - Περιγραφή δομής project
│
├── BRANCH_INFO.md                # Πληροφορίες για τα branches του project
│
├── IMPLEMENTATION_SUMMARY.md     # Περίληψη υλοποίησης και χαρακτηριστικών
│
├── ΟΔΗΓΙΕΣ_ΕΚΤΕΛΕΣΗΣ.md          # Απλές οδηγίες εκτέλεσης στα ελληνικά
│
├── ΟΔΗΓΟΣ                        # Οδηγίες για Git workflow (από το original repo)
│
├── requirements.txt              # Python dependencies για το project
│
├── test_api.py                   # Script για δοκιμή των API endpoints
│
├── manage.py                     # Django management script
│
├── db.sqlite3                    # SQLite database (δημιουργείται μετά το migrate)
│
├── cinema/                       # Η κύρια εφαρμογή για το cinema booking
│   │
│   ├── __init__.py              # Python package marker
│   │
│   ├── apps.py                  # Ρυθμίσεις εφαρμογής cinema
│   │                             # Ορίζει το όνομα και τη διαμόρφωση της εφαρμογής
│   │
│   ├── models.py                # Ορισμός των database models:
│   │                             # - Movie (Ταινία)
│   │                             # - Screening (Προβολή)
│   │                             # - Booking (Κράτηση)
│   │
│   ├── serializers.py           # REST API serializers
│   │                             # Μετατρέπουν models σε JSON και αντίστροφα
│   │                             # - MovieSerializer
│   │                             # - ScreeningSerializer
│   │                             # - BookingSerializer
│   │
│   ├── views.py                 # API ViewSets
│   │                             # Περιέχουν τη λογική για CRUD operations
│   │                             # - MovieViewSet
│   │                             # - ScreeningViewSet
│   │                             # - BookingViewSet
│   │
│   ├── urls.py                  # URL routing για την cinema app
│   │                             # Ορίζει τα endpoints: /api/movies/, /api/screenings/, /api/bookings/
│   │
│   ├── admin.py                 # Ρυθμίσεις Django admin panel
│   │                             # Καταχωρεί τα models στο admin interface
│   │
│   ├── tests.py                 # Unit tests (έτοιμο για προσθήκη tests)
│   │
│   └── migrations/              # Database migrations
│       ├── __init__.py
│       └── 0001_initial.py      # Αρχική migration για τα models
│
└── cinema_backend/              # Ρυθμίσεις Django project
    │
    ├── __init__.py              # Python package marker
    │
    ├── settings.py              # Κύριες ρυθμίσεις Django project
    │                             # - INSTALLED_APPS (εφαρμογές που χρησιμοποιούνται)
    │                             # - MIDDLEWARE (CORS, authentication, κλπ)
    │                             # - DATABASE settings (SQLite)
    │                             # - REST_FRAMEWORK configuration
    │                             # - CORS settings
    │
    ├── urls.py                  # Κύριο URL routing
    │                             # - /admin/ για Django admin
    │                             # - /api/ για cinema API endpoints
    │
    ├── wsgi.py                  # WSGI configuration για production deployment
    │
    └── asgi.py                  # ASGI configuration για async support

```

## Περιγραφή Βασικών Αρχείων / Description of Main Files

### Configuration Files

#### requirements.txt
Περιέχει όλα τα Python packages που χρειάζονται:
- Django: Web framework
- djangorestframework: REST API
- django-cors-headers: CORS support
- django-filter: Filtering support

#### settings.py
Το κέντρο ρυθμίσεων του project. Περιλαμβάνει:
- Εγκατεστημένες εφαρμογές (INSTALLED_APPS)
- Middleware configuration
- Database settings
- REST Framework settings
- CORS settings

### Application Files

#### models.py
Ορίζει τη δομή της βάσης δεδομένων:
- **Movie**: Αποθηκεύει ταινίες (τίτλος, περιγραφή, διάρκεια, κλπ)
- **Screening**: Αποθηκεύει προβολές (ταινία, ώρα, θέσεις, τιμή)
- **Booking**: Αποθηκεύει κρατήσεις (πελάτης, θέσεις, τιμή)

#### serializers.py
Μετατρέπει τα Django models σε JSON για το API:
- Επικυρώνει δεδομένα εισόδου
- Μορφοποιεί δεδομένα εξόδου
- Ορίζει read-only fields

#### views.py
Περιέχει τη λογική για το API:
- CRUD operations (Create, Read, Update, Delete)
- Custom actions (π.χ. /movies/{id}/screenings/)
- Filtering και searching

#### urls.py
Ορίζει τα URL patterns:
- Χρησιμοποιεί Django REST Framework Router
- Δημιουργεί αυτόματα endpoints για κάθε ViewSet

#### admin.py
Ρυθμίζει το Django admin panel:
- Καταχωρεί models
- Ορίζει display fields
- Προσθέτει filters και search

## Workflow

### 1. Request Flow
```
Browser/Angular
    ↓
Django URL Router (urls.py)
    ↓
ViewSet (views.py)
    ↓
Serializer (serializers.py)
    ↓
Model (models.py)
    ↓
Database (db.sqlite3)
```

### 2. Development Workflow
```
1. Κάνετε αλλαγές στον κώδικα
2. Τρέχετε migrations αν χρειάζεται: python manage.py makemigrations && python manage.py migrate
3. Ξεκινάτε το server: python manage.py runserver
4. Δοκιμάζετε το API: curl http://127.0.0.1:8000/api/
```

## Τεχνολογίες που Χρησιμοποιούνται / Technologies Used

- **Django 5.2**: Python web framework
- **Django REST Framework**: API development
- **django-cors-headers**: Cross-Origin Resource Sharing
- **django-filter**: Advanced filtering
- **SQLite**: Database (development)

## Επόμενα Βήματα / Next Steps

Για production deployment:
1. Αλλάξτε SECRET_KEY
2. Θέστε DEBUG = False
3. Προσθέστε ALLOWED_HOSTS
4. Χρησιμοποιήστε PostgreSQL/MySQL
5. Προσθέστε authentication
6. Προσθέστε comprehensive tests
7. Ρυθμίστε static files serving
8. Προσθέστε logging

## Πληροφορίες Επικοινωνίας / Contact

Για ερωτήσεις ή προβλήματα, δημιουργήστε issue στο GitHub repository.
