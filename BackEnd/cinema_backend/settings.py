"""cinema_backend Django settings."""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-dev-only-change-in-production')

DEBUG = os.environ.get('DEBUG', 'False') == 'True'

_allowed = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,backend,testserver')
ALLOWED_HOSTS = [h.strip() for h in _allowed.split(',') if h.strip()]


# Ορισμός εγκατεστημένων εφαρμογών
# Application definition

INSTALLED_APPS = [
    'jazzmin',
    'channels',
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
    'cinema',  # Η εφαρμογή cinema με τα models μας
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
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
ASGI_APPLICATION = 'cinema_backend.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}


# Database — PostgreSQL (Docker) with env-var fallback for local dev
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'cinema_db'),
        'USER': os.environ.get('DB_USER', 'cinema_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'cinema_pass'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
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

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

APPEND_SLASH = True

# Ρυθμίσεις CORS για επικοινωνία με Angular frontend
# CORS settings for communication with Angular frontend
# CORS
_cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]
else:
    CORS_ALLOW_ALL_ORIGINS = True  # dev fallback

_csrf_trusted_origins = os.environ.get(
    'CSRF_TRUSTED_ORIGINS',
    'http://localhost:8080,http://127.0.0.1:8080,http://localhost,http://127.0.0.1'
)
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_trusted_origins.split(',') if o.strip()]

_frontend_allowed_origins = os.environ.get(
    'FRONTEND_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080'
)
FRONTEND_ALLOWED_ORIGINS = [o.strip().rstrip('/') for o in _frontend_allowed_origins.split(',') if o.strip()]

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
TMDB_API_KEY = os.environ.get('TMDB_API_KEY', '')

# Stripe
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Django admin theme (Jazzmin)
JAZZMIN_SETTINGS = {
    'site_title': 'AbsoluteCinema Admin',
    'site_header': 'AbsoluteCinema',
    'site_brand': 'AbsoluteCinema',
    'welcome_sign': 'Welcome to AbsoluteCinema Admin',
    'copyright': 'AbsoluteCinema',
}
