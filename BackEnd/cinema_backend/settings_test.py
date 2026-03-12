"""Test settings.

Uses SQLite so the test suite doesn't depend on a local MySQL/MariaDB instance
or credentials.

Run:
    ./.venv/Scripts/python.exe manage.py test cinema --settings=cinema_backend.settings_test
"""

from __future__ import annotations

from . import settings as base_settings


for _name in dir(base_settings):
    if _name.isupper():
        globals()[_name] = getattr(base_settings, _name)


# Override DB for tests.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        # File-based DB is more stable than :memory: for Django test runner.
        "NAME": base_settings.BASE_DIR / "test_db.sqlite3",
    }
}

# Speed up tests.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
