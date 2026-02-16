# Running Instructions

This document provides instructions on how to set up and run the Cinema-Django-Backend application.

## Prerequisites

-   Python 3.x
-   pip
-   **MariaDB 10.5+** (download: https://mariadb.org/download/)
-   *(Optional)* **HeidiSQL** GUI (download: https://www.heidisql.com/download.php)

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Cinema-Django-Backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv .venv
    # On Windows
    .venv\Scripts\activate
    # On macOS/Linux
    source .venv/bin/activate
    ```

3.  **Setup MariaDB Database:**
    
    a. Κατέβασε και εγκατέστησε **MariaDB** από το επίσημο site: https://mariadb.org/download/
       - Σε Windows, επίλεξε MSI installer και άφησε την προεπιλεγμένη πόρτα 3306.
         - Σύνδεση: Host `127.0.0.1`, User `root`, Port `3306`.
         - Αν ο `root` έχει password (σύνηθες), θα χρειαστεί να το περάσεις ως environment variable (βλ. παρακάτω).

     b. **Ρύθμιση credentials μέσω environment variables (Windows PowerShell):**
         ```powershell
         $env:DB_HOST="127.0.0.1"
         $env:DB_PORT="3306"
         $env:DB_NAME="cinema_db"
         $env:DB_USER="root"
         $env:DB_PASSWORD="<το_root_password_σου στο MARIADB>"
         ```
         (Αυτά χρησιμοποιούνται τόσο από το Django όσο και από το `create_db.py`.)

## Quick Bootstrap (recommended)

Μετά το `pip install -r requirements.txt`, μπορείς να κάνεις bootstrap τη βάση + migrations + dev accounts με μία εντολή.

1) Βάλε τα `DB_*` env vars (Windows PowerShell):
```powershell
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
$env:DB_NAME="cinema_db"
$env:DB_USER="root"
$env:DB_PASSWORD="<το_root_password_σου>"
```

2) (Optional) Βάλε passwords για τα dev accounts ως env vars:
```powershell
$env:ADMIN_PASSWORD="Admin123!"
$env:STAFF_PASSWORD="Staff123!"
```

3) Τρέξε bootstrap:
```bash
python bootstrap_dev.py
```

4. **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5. **Create database**
    ```bash
    python create_db.py
    ```

6. **Run database migrations:**
    ```bash
    python manage.py migrate
    ```

7. **Create accounts (admin + staff):**
    ```bash
    python manage.py bootstrap_accounts
    ```
    (Αν δεν δώσεις `ADMIN_PASSWORD`/`STAFF_PASSWORD`, θα χρησιμοποιηθούν defaults.)

8. **(Optional) Load sample data:**
    ```bash
    python sample_data_script.py
    ```

## Running the Application

1.  **Start the development server:**
    ```bash
    python manage.py runserver
    ```

2.  **Access the application:**
    -   **API:** The API is available at `http://127.0.0.1:8000/api/`.
    -   **Admin Panel:** The Django admin panel is available at `http://127.0.0.1:8000/admin/`. Log in with the superuser credentials you created.

## 3‑Tier Architecture (εργασία)

- **Front‑end:** ξεχωριστή εφαρμογή (π.χ. Angular/React) που καλεί το backend μόνο μέσω REST (JSON) στο `/api/`.
- **Business logic:** Django + Django REST Framework (Python, OOP).
- **Database:** MySQL/MariaDB (σχεσιακή). Πρόσβαση γίνεται μέσω Django ORM (models/querysets).

## Controllers / Business / Data + Dependency Injection (μάθημα)

- **Controllers:** DRF views (endpoints)
- **Business logic:** `cinema/services.py`
- **Data layer:** `cinema/repositories.py` (Django ORM)
- **DI:** `dependency-injector` container wired στο startup (Cinema AppConfig `ready()`).

Σημείωση: Για τοπική ανάπτυξη, το CORS είναι ενεργό στο backend ώστε ένα front‑end σε άλλο origin/port να μπορεί να καλέσει το API.

## API Documentation

Δείτε το [API_DOCS.md](API_DOCS.md) για πλήρη λίστα endpoints.

## Running Tests (integration)

Τα tests χρησιμοποιούν τη βάση που έχεις ρυθμίσει (MariaDB). Για να τρέξουν, ο χρήστης της βάσης πρέπει να έχει δικαίωμα να δημιουργήσει test database (π.χ. `test_cinema_db`).

1) Βάλε τα `DB_*` env vars στο ίδιο PowerShell:
```powershell
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
$env:DB_NAME="cinema_db"
$env:DB_USER="root"
$env:DB_PASSWORD="<το_root_password_σου>"
```

2) Τρέξε tests:
```bash
python manage.py test
```