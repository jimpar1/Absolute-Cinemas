# Running Instructions

This document provides instructions on how to set up and run the Cinema-Django-Backend application.

## Prerequisites

-   Python 3.x
-   pip

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

4.  **Run database migrations:**
    ```bash
    python manage.py migrate
    ```

5.  **Create a superuser:**
    ```bash
    python manage.py createsuperuser
    ```
    Follow the prompts to create an administrator account.

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



