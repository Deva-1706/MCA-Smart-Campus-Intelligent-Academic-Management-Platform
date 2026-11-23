
"""Django settings for MCA Smart Campus (environment-driven & production-hardened)."""

import importlib.util
import os
import sys
import warnings
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured

from .env_config import build_django_config, load_project_dotenv, parse_bool

BASE_DIR = Path(__file__).resolve().parent.parent

# Load local .env file without overriding existing OS / hosting platform variables
load_project_dotenv(BASE_DIR)

IS_TEST_RUNNER = 'test' in sys.argv

try:
    _ENV_CFG = build_django_config(os.environ, BASE_DIR, is_test_runner=IS_TEST_RUNNER)
except ValueError as exc:
    raise ImproperlyConfigured(str(exc)) from exc

# ---------------------------------------------------------------------------
# 1. Core Django Environment Configuration
# ---------------------------------------------------------------------------
DJANGO_ENV = _ENV_CFG['DJANGO_ENV']
IS_PRODUCTION = _ENV_CFG['IS_PRODUCTION']
DEBUG = _ENV_CFG['DEBUG']
SECRET_KEY = _ENV_CFG['SECRET_KEY']
ALLOWED_HOSTS = _ENV_CFG['ALLOWED_HOSTS']
CSRF_TRUSTED_ORIGINS = _ENV_CFG['CSRF_TRUSTED_ORIGINS']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'mca_portal.apps.McaPortalConfig',
]

_HAS_WHITENOISE = importlib.util.find_spec('whitenoise') is not None

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    *(
        ['whitenoise.middleware.WhiteNoiseMiddleware']
        if _HAS_WHITENOISE
        else []
    ),
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# UPDATED: Load project URLs through the registered portal namespace
ROOT_URLCONF = 'mca_portal.root_urls'

WSGI_APPLICATION = 'mca_portal.wsgi.application'
ASGI_APPLICATION = 'mca_portal.asgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# 2. Database Configuration (DATABASE_URL: PostgreSQL or local SQLite)
# ---------------------------------------------------------------------------
DATABASES = _ENV_CFG['DATABASES']

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# 3. Static & Media File Configuration
# ---------------------------------------------------------------------------
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': (
            'whitenoise.storage.CompressedManifestStaticFilesStorage'
            if (_HAS_WHITENOISE and not DEBUG and not IS_TEST_RUNNER)
            else 'django.contrib.staticfiles.storage.StaticFilesStorage'
        ),
    },
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 12 * 1024 * 1024

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# 4. Cookie Encryption, Remember-Me, Session & HTTPS Security Settings
# ---------------------------------------------------------------------------
COOKIE_ENCRYPTION_SECRET = _ENV_CFG['COOKIE_ENCRYPTION_SECRET']
REMEMBER_ME_DAYS = _ENV_CFG['REMEMBER_ME_DAYS']
REMEMBER_ME_MAX_AGE = _ENV_CFG['REMEMBER_ME_MAX_AGE']
REMEMBER_ME_COOKIE_NAME = _ENV_CFG['REMEMBER_ME_COOKIE_NAME']

SESSION_COOKIE_AGE = REMEMBER_ME_MAX_AGE
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = _ENV_CFG['SESSION_COOKIE_SECURE']
SESSION_SAVE_EVERY_REQUEST = True

CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = _ENV_CFG['CSRF_COOKIE_SECURE']

X_FRAME_OPTIONS = 'SAMEORIGIN'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'same-origin'
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'
SECURE_SSL_REDIRECT = _ENV_CFG['SECURE_SSL_REDIRECT']

if (IS_PRODUCTION or not DEBUG) and not IS_TEST_RUNNER:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    if SECURE_SSL_REDIRECT:
        SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_SECURE_HSTS_SECONDS', '31536000'))
        SECURE_HSTS_INCLUDE_SUBDOMAINS = True
        SECURE_HSTS_PRELOAD = True

# ---------------------------------------------------------------------------
# 5. SMTP Email Configuration (STARTTLS on 587 / SSL on 465)
# ---------------------------------------------------------------------------
SMTP_HOST = _ENV_CFG['SMTP_HOST']
SMTP_PORT = _ENV_CFG['SMTP_PORT']
SMTP_SECURE = _ENV_CFG['SMTP_SECURE']
SMTP_USER = _ENV_CFG['SMTP_USER']
SMTP_FROM = _ENV_CFG['SMTP_FROM']
SMTP_CONFIGURED = _ENV_CFG['SMTP_CONFIGURED']

EMAIL_BACKEND = _ENV_CFG['EMAIL_BACKEND']
EMAIL_HOST = _ENV_CFG['EMAIL_HOST']
EMAIL_PORT = _ENV_CFG['EMAIL_PORT']
EMAIL_USE_TLS = _ENV_CFG['EMAIL_USE_TLS']
EMAIL_USE_SSL = _ENV_CFG['EMAIL_USE_SSL']
EMAIL_HOST_USER = _ENV_CFG['EMAIL_HOST_USER']
EMAIL_HOST_PASSWORD = _ENV_CFG['EMAIL_HOST_PASSWORD']
DEFAULT_FROM_EMAIL = _ENV_CFG['DEFAULT_FROM_EMAIL']
SERVER_EMAIL = _ENV_CFG['SERVER_EMAIL']
EMAIL_TIMEOUT = _ENV_CFG['EMAIL_TIMEOUT']

# ---------------------------------------------------------------------------
# 6. Authentication Rate Limiting & Redirects
# ---------------------------------------------------------------------------
PASSWORD_RESET_TIMEOUT = 900
AUTH_MAX_FAILED_ATTEMPTS = 5
AUTH_LOCKOUT_SECONDS = 900

LOGIN_URL = 'portal:login'
LOGIN_REDIRECT_URL = 'portal:dashboard'
LOGOUT_REDIRECT_URL = 'portal:home'

# ---------------------------------------------------------------------------
# 7. Structured Logging (Never logs secrets or credentials)
# ---------------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'structured': {
            'format': '%(asctime)s %(levelname)s %(name)s %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'structured',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO' if not DEBUG else 'WARNING',
    },
    'loggers': {
        'mca_portal': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ---------------------------------------------------------------------------
# 8. Development-Only Demo Mode & One-Click Portal Access
# Strictly requires explicit opt-in + DEBUG=True + approved local hosts.
# Permanently disabled in production.
# ---------------------------------------------------------------------------
DEMO_MODE = _ENV_CFG['DEMO_MODE']
DEMO_PORTAL_ACCESS = _ENV_CFG['DEMO_PORTAL_ACCESS']
DEMO_PORTAL_ALLOWED_HOSTS = _ENV_CFG['DEMO_PORTAL_ALLOWED_HOSTS']

# Seed command usernames (only used by local setup_demo_student management command)
DEMO_STUDENT_USERNAME = os.environ.get('DEMO_STUDENT_USERNAME', 'mca_demo_student')
DEMO_STUDENT_PASSWORD = os.environ.get('DEMO_STUDENT_PASSWORD', 'McaDemo@2026!')
DEMO_FACULTY_USERNAME = os.environ.get('DEMO_FACULTY_USERNAME', 'hcasican_faculty')
DEMO_FACULTY_PASSWORD = os.environ.get('DEMO_FACULTY_PASSWORD', 'Faculty@2026!')
DEMO_ADMIN_USERNAME = os.environ.get('DEMO_ADMIN_USERNAME', 'campus_admin')
DEMO_ADMIN_PASSWORD = os.environ.get('DEMO_ADMIN_PASSWORD', 'Admin@2026!')

# Demo credentials feature toggle (strictly disabled in production or DEBUG=False)
_raw_demo_creds = os.environ.get('DEMO_CREDENTIALS_ENABLED', os.environ.get('SHOW_DEMO_CREDENTIALS'))
if _raw_demo_creds is not None:
    DEMO_CREDENTIALS_ENABLED = parse_bool(
        _raw_demo_creds,
        default=False,
        name='DEMO_CREDENTIALS_ENABLED',
    ) if (DEBUG and not IS_PRODUCTION) else False
else:
    DEMO_CREDENTIALS_ENABLED = bool(DEBUG and not IS_PRODUCTION and (DEMO_MODE or DEMO_PORTAL_ACCESS))

# Emit sanitized non-fatal warnings in development without crashing startup
if not IS_TEST_RUNNER:
    for _cfg_warning in _ENV_CFG['CONFIG_WARNINGS']:
        warnings.warn(f'[MCA Smart Campus Config] {_cfg_warning}', RuntimeWarning, stacklevel=1)
