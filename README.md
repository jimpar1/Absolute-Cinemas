# Cinema Django Backend

## Περιγραφή Project

Αυτό είναι ένα απλό Django backend για εφαρμογή κράτησης εισιτηρίων σινεμά. Το project παρέχει REST API endpoints για τη διαχείριση ταινιών, προβολών και κρατήσεων.

### Χαρακτηριστικά

- 🎬 **Διαχείριση Ταινιών (Movies)**: Δημιουργία, ανάγνωση, ενημέρωση και διαγραφή ταινιών
- 📅 **Διαχείριση Προβολών (Screenings)**: Προγραμματισμός προβολών ταινιών με πληροφορίες αίθουσας, ώρας και διαθέσιμων θέσεων
- 🎫 **Διαχείριση Κρατήσεων (Bookings)**: Κράτηση εισιτηρίων από πελάτες με αυτόματο υπολογισμό τιμής
- 🔌 **REST API**: Πλήρες API με Django REST Framework
- 🌐 **CORS Enabled**: Ενεργοποιημένο για συνεργασία με Angular frontend
- 🔍 **Αναζήτηση και Φιλτράρισμα**: Δυνατότητες αναζήτησης και φιλτραρίσματος δεδομένων
- 📊 **Admin Panel**: Django admin interface για εύκολη διαχείριση

## Τεχνολογίες

- **Django 5.2**: Python web framework
- **Django REST Framework**: Για τη δημιουργία REST API
- **django-cors-headers**: Για την ενεργοποίηση CORS
- **django-filter**: Για φιλτράρισμα δεδομένων στο API
- **SQLite**: Βάση δεδομένων (default για development)

## Δομή Project

```
Cinema-Django-Backend/
├── cinema/                      # Η κύρια εφαρμογή cinema
│   ├── migrations/             # Database migrations
│   ├── __init__.py
│   ├── admin.py               # Ρυθμίσεις Django admin
│   ├── apps.py                # Διαμόρφωση εφαρμογής
│   ├── models.py              # Ορισμός models (Movie, Screening, Booking)
│   ├── serializers.py         # REST API serializers
│   ├── views.py               # API ViewSets
│   ├── urls.py                # URL routing για cinema app
│   └── tests.py               # Tests
├── cinema_backend/             # Ρυθμίσεις Django project
│   ├── __init__.py
│   ├── asgi.py               # ASGI configuration
│   ├── settings.py           # Κύριες ρυθμίσεις project
│   ├── urls.py               # Κύριο URL routing
│   └── wsgi.py               # WSGI configuration
├── manage.py                  # Django management script
├── requirements.txt           # Python dependencies
└── README.md                 # Αυτό το αρχείο
```

## Models

### 1. Movie (Ταινία)

Αποθηκεύει πληροφορίες για τις ταινίες που προβάλλονται.

**Πεδία:**
- `title`: Τίτλος ταινίας
- `description`: Περιγραφή
- `duration`: Διάρκεια σε λεπτά
- `genre`: Είδος ταινίας
- `director`: Σκηνοθέτης
- `release_year`: Έτος κυκλοφορίας
- `rating`: Βαθμολογία (0-10)
- `poster_url`: URL αφίσας
- `created_at`, `updated_at`: Timestamps

### 2. Screening (Προβολή)

Αποθηκεύει πληροφορίες για τις προβολές ταινιών.

**Πεδία:**
- `movie`: Foreign Key στο Movie
- `screen_number`: Αριθμός αίθουσας
- `start_time`: Ώρα έναρξης
- `end_time`: Ώρα λήξης
- `available_seats`: Διαθέσιμες θέσεις
- `total_seats`: Συνολικές θέσεις
- `price`: Τιμή εισιτηρίου
- `created_at`, `updated_at`: Timestamps

### 3. Booking (Κράτηση)

Αποθηκεύει πληροφορίες για τις κρατήσεις πελατών.

**Πεδία:**
- `screening`: Foreign Key στο Screening
- `customer_name`: Όνομα πελάτη
- `customer_email`: Email πελάτη
- `customer_phone`: Τηλέφωνο
- `seats_booked`: Αριθμός θέσεων που κρατήθηκαν
- `total_price`: Συνολική τιμή (υπολογίζεται αυτόματα)
- `status`: Κατάσταση (pending, confirmed, cancelled)
- `booking_date`: Ημερομηνία κράτησης
- `created_at`, `updated_at`: Timestamps

## Εγκατάσταση

### Προαπαιτούμενα

- Python 3.8 ή νεότερο
- pip (Python package manager)

### Βήματα Εγκατάστασης

1. **Clone το repository:**
   ```bash
   git clone https://github.com/jimpar1/Cinema-Django-Backend.git
   cd Cinema-Django-Backend
   ```

2. **Checkout στο σωστό branch:**
   ```bash
   git checkout First-Code-Base
   ```

3. **Δημιουργία virtual environment (προαιρετικό αλλά συνιστάται):**
   ```bash
   python -m venv venv
   
   # Ενεργοποίηση στα Windows:
   venv\Scripts\activate
   
   # Ενεργοποίηση στα Linux/Mac:
   source venv/bin/activate
   ```

4. **Εγκατάσταση dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Εκτέλεση migrations (δημιουργία βάσης δεδομένων):**
   ```bash
   python manage.py migrate
   ```

6. **Δημιουργία superuser για πρόσβαση στο admin (προαιρετικό):**
   ```bash
   python manage.py createsuperuser
   ```

## Εκτέλεση

### Εκκίνηση Development Server

```bash
python manage.py runserver
```

Το server θα ξεκινήσει στο `http://127.0.0.1:8000/`

### Πρόσβαση στα Endpoints

- **API Root**: `http://127.0.0.1:8000/api/`
- **Movies API**: `http://127.0.0.1:8000/api/movies/`
- **Screenings API**: `http://127.0.0.1:8000/api/screenings/`
- **Bookings API**: `http://127.0.0.1:8000/api/bookings/`
- **Admin Panel**: `http://127.0.0.1:8000/admin/`

## API Endpoints

### Movies (Ταινίες)

- `GET /api/movies/` - Λίστα όλων των ταινιών
- `GET /api/movies/{id}/` - Λεπτομέρειες συγκεκριμένης ταινίας
- `POST /api/movies/` - Δημιουργία νέας ταινίας
- `PUT /api/movies/{id}/` - Πλήρης ενημέρωση ταινίας
- `PATCH /api/movies/{id}/` - Μερική ενημέρωση ταινίας
- `DELETE /api/movies/{id}/` - Διαγραφή ταινίας
- `GET /api/movies/{id}/screenings/` - Προβολές συγκεκριμένης ταινίας

**Παράδειγμα POST request:**
```json
{
  "title": "The Matrix",
  "description": "A computer hacker learns about the true nature of reality",
  "duration": 136,
  "genre": "Sci-Fi",
  "director": "The Wachowskis",
  "release_year": 1999,
  "rating": 8.7,
  "poster_url": "https://example.com/matrix.jpg"
}
```

### Screenings (Προβολές)

- `GET /api/screenings/` - Λίστα όλων των προβολών
- `GET /api/screenings/{id}/` - Λεπτομέρειες συγκεκριμένης προβολής
- `POST /api/screenings/` - Δημιουργία νέας προβολής
- `PUT /api/screenings/{id}/` - Πλήρης ενημέρωση προβολής
- `PATCH /api/screenings/{id}/` - Μερική ενημέρωση προβολής
- `DELETE /api/screenings/{id}/` - Διαγραφή προβολής
- `GET /api/screenings/{id}/bookings/` - Κρατήσεις συγκεκριμένης προβολής

**Παράδειγμα POST request:**
```json
{
  "movie": 1,
  "screen_number": 1,
  "start_time": "2025-10-15T18:00:00Z",
  "end_time": "2025-10-15T20:30:00Z",
  "available_seats": 100,
  "total_seats": 100,
  "price": "10.00"
}
```

### Bookings (Κρατήσεις)

- `GET /api/bookings/` - Λίστα όλων των κρατήσεων
- `GET /api/bookings/{id}/` - Λεπτομέρειες συγκεκριμένης κράτησης
- `POST /api/bookings/` - Δημιουργία νέας κράτησης
- `PUT /api/bookings/{id}/` - Πλήρης ενημέρωση κράτησης
- `PATCH /api/bookings/{id}/` - Μερική ενημέρωση κράτησης
- `DELETE /api/bookings/{id}/` - Διαγραφή κράτησης

**Παράδειγμα POST request:**
```json
{
  "screening": 1,
  "customer_name": "Γιάννης Παπαδόπουλος",
  "customer_email": "giannis@example.com",
  "customer_phone": "6912345678",
  "seats_booked": 2,
  "status": "confirmed"
}
```

**Σημείωση:** Το πεδίο `total_price` υπολογίζεται αυτόματα (seats_booked × screening.price).

## Αναζήτηση και Φιλτράρισμα

### Movies

- **Αναζήτηση:** `?search=matrix` (αναζητά στον τίτλο, σκηνοθέτη, είδος)
- **Ταξινόμηση:** `?ordering=-rating` (διαθέσιμα: title, release_year, rating, created_at)

### Screenings

- **Φιλτράρισμα:** `?movie=1&screen_number=2`
- **Ταξινόμηση:** `?ordering=start_time` (διαθέσιμα: start_time, price, available_seats)

### Bookings

- **Αναζήτηση:** `?search=john` (αναζητά σε όνομα και email πελάτη)
- **Φιλτράρισμα:** `?status=confirmed&screening=1`
- **Ταξινόμηση:** `?ordering=-booking_date` (διαθέσιμα: booking_date, total_price)

## Κατανόηση του Κώδικα

### Αρχιτεκτονική

Το project ακολουθεί την αρχιτεκτονική του Django:

1. **Models (models.py)**: Ορίζουν τη δομή της βάσης δεδομένων
2. **Serializers (serializers.py)**: Μετατρέπουν τα models σε JSON και αντίστροφα
3. **Views (views.py)**: Περιέχουν τη λογική για το API (ViewSets)
4. **URLs (urls.py)**: Ορίζουν τα endpoints του API
5. **Admin (admin.py)**: Ρυθμίσεις για το Django admin panel

### Βασικές Έννοιες

#### ViewSets
Τα ViewSets παρέχουν αυτόματα όλες τις CRUD operations:
- `list()`: GET λίστα
- `retrieve()`: GET ένα στοιχείο
- `create()`: POST δημιουργία
- `update()`: PUT ενημέρωση
- `partial_update()`: PATCH μερική ενημέρωση
- `destroy()`: DELETE διαγραφή

#### Serializers
Οι Serializers:
- Επικυρώνουν τα δεδομένα εισόδου
- Μετατρέπουν Django models σε JSON
- Μετατρέπουν JSON σε Django models

#### CORS
Το CORS (Cross-Origin Resource Sharing) επιτρέπει στο Angular frontend να κάνει requests στο Django backend από διαφορετικό domain/port.

## Ασφάλεια

**Σημαντικό:** Αυτές οι ρυθμίσεις είναι για development. Για production:

1. Αλλάξτε το `SECRET_KEY` στο `settings.py`
2. Θέστε `DEBUG = False`
3. Ρυθμίστε το `ALLOWED_HOSTS`
4. Χρησιμοποιήστε συγκεκριμένα origins στο CORS αντί για `CORS_ALLOW_ALL_ORIGINS`
5. Προσθέστε authentication και permissions στο REST Framework
6. Χρησιμοποιήστε PostgreSQL ή MySQL αντί για SQLite

## Troubleshooting

### Πρόβλημα με migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Port already in use
```bash
python manage.py runserver 8001  # Χρησιμοποιήστε διαφορετικό port
```

### CORS errors
Βεβαιωθείτε ότι το `corsheaders` είναι εγκατεστημένο και σωστά ρυθμισμένο στο `settings.py`.

## Συνεισφορά

1. Fork το repository
2. Δημιουργήστε ένα feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit τις αλλαγές σας (`git commit -m 'Add some AmazingFeature'`)
4. Push στο branch (`git push origin feature/AmazingFeature`)
5. Ανοίξτε ένα Pull Request

## License

Αυτό το project είναι ανοιχτού κώδικα και διατίθεται για εκπαιδευτικούς σκοπούς.

## Επικοινωνία

Για ερωτήσεις ή προβλήματα, δημιουργήστε ένα issue στο GitHub repository.
