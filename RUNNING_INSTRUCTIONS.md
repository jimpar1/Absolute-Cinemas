# 🎬 Absolute Cinema — Οδηγίες Εγκατάστασης & Εκτέλεσης

## Τι χρειάζεσαι πριν ξεκινήσεις

- **Python 3.10+** εγκατεστημένο στο σύστημά σου
- **MariaDB 10.5+** — μπορείς να το κατεβάσεις από [εδώ](https://mariadb.org/download/)
- Ο **TMDB API Key** είναι ήδη ενσωματωμένος στο project, δεν χρειάζεται δικός σου

---

## Πρώτη φορά; Ξεκίνα εδώ

### Κατέβασε τον κώδικα και φτιάξε virtual environment

```bash
git clone <repository-url>
cd Cinema-Django-Backend

python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### Εγκατέστησε τα dependencies

```bash
pip install -r requirements.txt
```

### Ρύθμισε τη σύνδεση με τη βάση

Αν η MariaDB τρέχει τοπικά με τις default ρυθμίσεις (user `root`, χωρίς password, πόρτα `3306`), δεν χρειάζεται να κάνεις τίποτα παραπάνω.

Αν έχεις password ή διαφορετικές ρυθμίσεις, πέρασέ τα πριν τρέξεις οτιδήποτε:

```powershell
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
$env:DB_NAME="cinema_db"
$env:DB_USER="root"
$env:DB_PASSWORD="βάλε_εδώ_το_password_σου"
```

### Στήσε τη βάση — μία εντολή, τα κάνει όλα

```bash
python create_db.py
```

Αυτό το script κάνει τα εξής αυτόματα:
1. Διαγράφει την παλιά βάση (αν υπάρχει) και φτιάχνει καινούρια
2. Τρέχει τα Django migrations
3. Δημιουργεί τους χρήστες (admin + απλός user)
4. Φτιάχνει 3 αίθουσες κινηματογράφου με custom διατάξεις
5. Κατεβάζει 10 θρυλικές ταινίες από το TMDB (αφίσες, trailers, φωτογραφίες, ηθοποιούς)

> 💡 Μπορείς να το ξανατρέξεις ανά πάσα στιγμή αν θες clean reset — ξαναφτιάχνει τα πάντα από το μηδέν.

### Αν αλλάξεις κάτι στα models

Κάθε φορά που κάνεις αλλαγές στα Django models, πρέπει να δημιουργήσεις και να εφαρμόσεις τα migrations ξεχωριστά:

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## Εκτέλεση

```bash
python manage.py runserver
```

Μετά ανοίγεις τον browser σου:

- **REST API** → http://127.0.0.1:8000/api/
- **Django Admin** → http://127.0.0.1:8000/admin/

### Credentials για login

| Ρόλος | Username | Password |
|-------|----------|----------|
| Διαχειριστής | `admin` | `admin` |
| Απλός χρήστης | `user` | `user` |

---

## Πώς είναι δομημένο το project

```
Frontend (React)  ←—  REST/JSON  —→  Django Backend  ←—  ORM  —→  MariaDB
```

- **Views/Controllers** → DRF endpoints (`cinema/views.py`)
- **Business Logic** → `cinema/services.py`
- **Data Access** → `cinema/repositories.py` μέσω Django ORM
- **Dependency Injection** → `dependency-injector`, ρυθμίζεται αυτόματα στο startup

Το CORS είναι ενεργοποιημένο ώστε το React frontend (που τρέχει σε άλλο port) να μπορεί να επικοινωνεί με το API κανονικά.

---

## API Documentation

Για τα διαθέσιμα endpoints, δες το [API_DOCS.md](API_DOCS.md).

## Tests

```bash
python manage.py test
```

Τα tests δημιουργούν δική τους test database, οπότε φρόντισε ο DB user να έχει δικαίωμα δημιουργίας βάσεων.