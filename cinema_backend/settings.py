"""cinema_backend Django settings.

Το project είναι σχεδιασμένο ως 3-tier εφαρμογή:
1) Front-end: επικοινωνεί αποκλειστικά μέσω REST API
2) Business logic: Python/Django (αντικειμενοστρεφής γλώσσα)
3) Database: σχεσιακή (MySQL/MariaDB)

Το business logic επικοινωνεί με τη βάση μέσω Django ORM (models/querysets), όχι με raw SQL.
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-qk*=#z9=ln-mxqp=t9cxn=g+ao=%z0fh+%g&o3-gx8e8q7$44@'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']


# Ορισμός εγκατεστημένων εφαρμογών
# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Εφαρμογές τρίτων (Third-party apps)
    'rest_framework',  # Django REST Framework για API
    'rest_framework_simplejwt.token_blacklist',  # JWT token blacklisting
    'corsheaders',  # CORS headers για επικοινωνία με Angular frontend
    'django_filters',  # Django filters for DRF
    # Δικές μας εφαρμογές (Our apps)
    'cinema.apps.CinemaConfig',  # Η εφαρμογή cinema με DI wiring στο AppConfig
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS middleware - πρέπει να είναι πριν το CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cinema_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cinema_backend.wsgi.application'


# Database (Relational DB: MySQL/MariaDB)
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

# Ρυθμίσεις για MySQL/MariaDB Database
# MySQL/MariaDB Database Configuration
DB_NAME = os.environ.get('DB_NAME', 'cinema_db')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '3306')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}




# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Europe/Athens'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

APPEND_SLASH = True

# Ρυθμίσεις CORS για επικοινωνία με Angular frontend
# CORS settings for communication with Angular frontend
CORS_ALLOW_ALL_ORIGINS = True  # Για development - επιτρέπει όλα τα origins
# Για production, χρησιμοποιήστε: CORS_ALLOWED_ORIGINS = ['http://localhost:4200']

# Ρυθμίσεις Django REST Framework
# Django REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # Επιτρέπει πρόσβαση χωρίς authentication (για development)
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # JWT Authentication
        'rest_framework.authentication.SessionAuthentication',  # Session Authentication για admin
    ],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10  # Αριθμός αποτελεσμάτων ανά σελίδα
}

# JWT Settings
# Ρυθμίσεις για JSON Web Tokens
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),  # Access token διαρκεί 1 ώρα
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),  # Refresh token διαρκεί 7 ημέρες
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# TMDB API Key
TMDB_API_KEY = '18324c6e6eb5ceed0ea8c49c26fcf8b8'
