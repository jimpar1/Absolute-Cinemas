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
       - Σύνδεση: Host `127.0.0.1`, User `root`, Password '' , Port `3306`.

4. **Create database**
    ```bash
    python create_db.py
    ```

5. **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

6. **Run database migrations:**
    ```bash
    python manage.py migrate
    ```

7. **Create a superuser:**
    ```bash
    python manage.py createsuperuser
    ```
    Follow the prompts to create an administrator account.

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

Σημείωση: Για τοπική ανάπτυξη, το CORS είναι ενεργό στο backend ώστε ένα front‑end σε άλλο origin/port να μπορεί να καλέσει το API.

## API Documentation

Δείτε το [API_DOCS.md](API_DOCS.md) για πλήρη λίστα endpoints.



