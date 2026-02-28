"""Test settings.

Uses SQLite so the test suite doesn't depend on a local MySQL/MariaDB instance
or credentials.

Run:
    ./.venv/Scripts/python.exe manage.py test cinema --settings=cinema_backend.settings_test
"""

from __future__ import annotations

from .settings import *  # noqa: F403


# Override DB for tests.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        # File-based DB is more stable than :memory: for Django test runner.
        "NAME": BASE_DIR / "test_db.sqlite3",  # noqa: F405
    }
}

# Speed up tests.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
