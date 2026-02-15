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

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Setup MariaDB Database:**
    
    a. Κατέβασε και εγκατέστησε **MariaDB** από το επίσημο site: https://mariadb.org/download/
       - Σε Windows, επίλεξε MSI installer και άφησε την προεπιλεγμένη πόρτα 3306.
    
    b. *(Προαιρετικό)* Εγκατέστησε **HeidiSQL** για GUI: https://www.heidisql.com/download.php
       - Σύνδεση: Host `127.0.0.1`, User `root`, Password (ό,τι έβαλες), Port `3306`.
    
    c. Δημιούργησε τη βάση:
    ```sql
    CREATE DATABASE cinema_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```
    
    d. Ενημέρωσε το `cinema_backend/settings.py` με τα credentials σου:
    ```python
    DATABASES = {
        'default': {
            'USER': 'root',
            'PASSWORD': 'your_password_here',  # βάλε τον κωδικό σου
            'HOST': '127.0.0.1',
            'PORT': '3306',
        }
    }
    ```

5.  **Run database migrations:**
    ```bash
    python manage.py migrate
    ```

6.  **Create a superuser:**
    ```bash
    python manage.py createsuperuser
    ```
    Follow the prompts to create an administrator account.

7.  **(Optional) Load sample data:**
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
# API Documentation

This document outlines the available API endpoints for the Cinema-Django-Backend application.

## Base URL

The base URL for all API endpoints is `/api/`.



