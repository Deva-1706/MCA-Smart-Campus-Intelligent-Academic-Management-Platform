"""Environment variable loading, parsing, and security validation for MCA Smart Campus (Django)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Dict, List, Mapping, Optional, Tuple
from urllib.parse import parse_qs, unquote, urlparse

VALID_ENVIRONMENTS = {'development', 'production'}
DEFAULT_DEV_SECRET_KEY = 'mca-dev-only-change-before-production-deployment-secret-key'
DEFAULT_DEV_COOKIE_SECRET = 'mca-dev-only-cookie-encryption-secret-change-in-production'

_PLACEHOLDER_MARKERS = (
    'change_me',
    'replace_with',
    'your_',
    'placeholder',
    'example',
    'dev-only',
    'insecure',
    'secret_here',
    'my_',
)

_LOCAL_DEV_HOSTS = {'localhost', '127.0.0.1', '::1', '[::1]', 'testserver'}


def load_project_dotenv(base_dir: Path, filename: str = '.env') -> bool:
    """Load key=value pairs from .env without overwriting already-set environment variables."""
    env_path = Path(base_dir) / filename
    if not env_path.is_file():
        return False

    try:
        from dotenv import load_dotenv

        return bool(load_dotenv(env_path, override=False))
    except ImportError:
        pass

    try:
        for raw_line in env_path.read_text(encoding='utf-8').splitlines():
            line = raw_line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            if line.startswith('export '):
                line = line[7:].strip()
            key, _, val = line.partition('=')
            key = key.strip()
            val = val.strip()
            if not key or key in os.environ:
                continue
            if len(val) >= 2 and val[0] == val[-1] and val[0] in ('"', "'"):
                val = val[1:-1]
            os.environ[key] = val
        return True
    except OSError:
        return False


def parse_bool(raw: Optional[str], default: bool = False, name: str = '') -> bool:
    """Parse strict boolean environment values."""
    if raw is None or str(raw).strip() == '':
        return default
    normalized = str(raw).strip().lower()
    if normalized in ('1', 'true', 'yes', 'on'):
        return True
    if normalized in ('0', 'false', 'no', 'off'):
        return False
    label = name or 'Boolean setting'
    raise ValueError(f'{label} must be a boolean value (True/False, 1/0, yes/no), got "{raw}".')


def parse_csv(raw: Optional[str]) -> List[str]:
    """Parse comma-separated configuration lists cleanly."""
    if not raw:
        return []
    return [item.strip() for item in str(raw).split(',') if item.strip()]


def parse_int_range(
    raw: Optional[str],
    default: int,
    min_val: int,
    max_val: int,
    name: str,
) -> int:
    """Parse and range-check an integer environment variable."""
    if raw is None or str(raw).strip() == '':
        return default
    try:
        value = int(str(raw).strip())
    except ValueError as exc:
        raise ValueError(f'{name} must be an integer between {min_val} and {max_val}.') from exc
    if value < min_val or value > max_val:
        raise ValueError(f'{name} must be between {min_val} and {max_val}, got {value}.')
    return value


def is_placeholder_secret(value: str) -> bool:
    """Detect empty, short, or placeholder secrets without echoing the secret."""
    clean = (value or '').strip()
    if len(clean) < 32:
        return True
    lower = clean.lower()
    return any(marker in lower for marker in _PLACEHOLDER_MARKERS)


def parse_database_url(
    db_url: Optional[str],
    base_dir: Path,
    is_production: bool = False,
) -> Dict[str, object]:
    """Parse DATABASE_URL supporting PostgreSQL and SQLite with startup validation.

    Uses dj_database_url when installed and falls back to a strict stdlib URL parser so
    PostgreSQL URLs are never silently downgraded to SQLite.
    """
    clean_url = (db_url or '').strip()
    if not clean_url:
        return {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': Path(base_dir) / 'db.sqlite3',
            'OPTIONS': {'timeout': 20},
        }

    parsed = urlparse(clean_url)
    scheme = (parsed.scheme or '').lower()

    if scheme in ('postgres', 'postgresql', 'pgsql'):
        db_name = unquote((parsed.path or '').lstrip('/'))
        host = parsed.hostname or ''
        if not host:
            raise ValueError('DATABASE_URL for PostgreSQL must include a valid hostname.')
        if not db_name:
            raise ValueError('DATABASE_URL for PostgreSQL must include a database name.')

        try:
            import dj_database_url

            cfg = dj_database_url.parse(
                clean_url,
                conn_max_age=600,
                ssl_require=is_production,
            )
            cfg.setdefault('CONN_HEALTH_CHECKS', True)
            return cfg
        except ImportError:
            query_params = parse_qs(parsed.query)
            options: Dict[str, str] = {}
            sslmode = (query_params.get('sslmode') or [None])[0]
            if sslmode:
                options['sslmode'] = sslmode
            elif is_production:
                options['sslmode'] = 'require'

            cfg = {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': db_name,
                'USER': unquote(parsed.username or ''),
                'PASSWORD': unquote(parsed.password or ''),
                'HOST': host,
                'PORT': str(parsed.port or 5432),
                'CONN_MAX_AGE': 600,
                'CONN_HEALTH_CHECKS': True,
            }
            if options:
                cfg['OPTIONS'] = options
            return cfg

    if scheme == 'sqlite':
        raw_path = unquote(parsed.path or '')
        if clean_url in ('sqlite:///:memory:', 'sqlite://:memory:'):
            db_path: object = ':memory:'
        elif raw_path.startswith('/') and len(raw_path) > 1:
            # sqlite:///relative.sqlite3 -> raw_path='/relative.sqlite3' unless 4 slashes sqlite:////abs/path
            if clean_url.startswith('sqlite:////'):
                db_path = Path(raw_path)
            else:
                db_path = Path(base_dir) / raw_path.lstrip('/')
        else:
            db_path = Path(base_dir) / 'db.sqlite3'
        return {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': db_path,
            'OPTIONS': {'timeout': 20},
        }

    raise ValueError(
        f'Unsupported DATABASE_URL scheme "{scheme or "missing"}". '
        'Use postgres://, postgresql://, or sqlite:///, or leave unset for local SQLite.'
    )


def _is_approved_local_host(host: str) -> bool:
    clean = (host or '').strip().lower()
    return clean in _LOCAL_DEV_HOSTS


def build_django_config(
    env: Mapping[str, str],
    base_dir: Path,
    is_test_runner: bool = False,
) -> Dict[str, object]:
    """Parse and validate all 18 MCA Smart Campus Django environment variables.

    Raises ValueError on fatal configuration errors (converted to ImproperlyConfigured in settings.py).
    Never includes secret values in error messages or warning strings.
    """
    warnings_list: List[str] = []

    # 1. DJANGO_ENV
    django_env = str(env.get('DJANGO_ENV', 'development') or 'development').strip().lower()
    if django_env not in VALID_ENVIRONMENTS:
        raise ValueError(
            f'DJANGO_ENV must be one of {sorted(VALID_ENVIRONMENTS)}, got "{django_env}".'
        )
    is_production = django_env == 'production'

    # 2. DJANGO_DEBUG
    debug_default = False if is_production else True
    debug = parse_bool(env.get('DJANGO_DEBUG'), default=debug_default, name='DJANGO_DEBUG')
    if is_production and debug:
        raise ValueError('DJANGO_DEBUG must be False when DJANGO_ENV is set to "production".')

    # 3. DJANGO_SECRET_KEY
    raw_secret_key = str(env.get('DJANGO_SECRET_KEY', '') or '').strip()
    if is_production or (not debug and not is_test_runner):
        if not raw_secret_key or is_placeholder_secret(raw_secret_key):
            raise ValueError(
                'DJANGO_SECRET_KEY must be set to a strong, unique secret (at least 32 non-placeholder characters) in production.'
            )
        secret_key = raw_secret_key
    else:
        secret_key = raw_secret_key or DEFAULT_DEV_SECRET_KEY
        if not raw_secret_key or is_placeholder_secret(secret_key):
            warnings_list.append(
                'DJANGO_SECRET_KEY is using a development fallback; set a 50+ character random key before production deployment.'
            )

    # 4. DJANGO_ALLOWED_HOSTS
    raw_allowed_hosts = env.get('DJANGO_ALLOWED_HOSTS')
    allowed_hosts = parse_csv(raw_allowed_hosts)
    if is_production:
        if not allowed_hosts:
            raise ValueError(
                'DJANGO_ALLOWED_HOSTS must be explicitly configured with your deployment hostname(s) in production.'
            )
        if '*' in allowed_hosts:
            raise ValueError('DJANGO_ALLOWED_HOSTS cannot contain wildcard "*" in production.')
    elif not allowed_hosts:
        allowed_hosts = ['localhost', '127.0.0.1', 'testserver']

    # 5. DJANGO_CSRF_TRUSTED_ORIGINS
    csrf_trusted_origins = parse_csv(env.get('DJANGO_CSRF_TRUSTED_ORIGINS'))
    for origin in csrf_trusted_origins:
        if not origin.startswith(('http://', 'https://')):
            raise ValueError(
                f'DJANGO_CSRF_TRUSTED_ORIGINS entry "{origin}" must include scheme (e.g., https://yourdomain.com).'
            )
        if is_production and not origin.startswith('https://'):
            raise ValueError(
                f'DJANGO_CSRF_TRUSTED_ORIGINS entry "{origin}" must use https:// in production.'
            )
    if is_production and not csrf_trusted_origins:
        warnings_list.append(
            'DJANGO_CSRF_TRUSTED_ORIGINS is empty in production; configure your HTTPS origin(s) before handling POST forms.'
        )

    # 6. DJANGO_SECURE_SSL_REDIRECT
    ssl_redirect_default = True if (is_production and not is_test_runner) else False
    secure_ssl_redirect = parse_bool(
        env.get('DJANGO_SECURE_SSL_REDIRECT'),
        default=ssl_redirect_default,
        name='DJANGO_SECURE_SSL_REDIRECT',
    )
    if is_test_runner:
        secure_ssl_redirect = False

    # 7. DATABASE_URL
    database_config = parse_database_url(
        env.get('DATABASE_URL'),
        base_dir=base_dir,
        is_production=is_production,
    )
    if is_production and database_config.get('ENGINE') == 'django.db.backends.sqlite3':
        warnings_list.append(
            'DATABASE_URL is not configured for PostgreSQL in production; currently using SQLite.'
        )

    # 8-10. DEMO_MODE, DEMO_PORTAL_ACCESS, DEMO_PORTAL_ALLOWED_HOSTS
    requested_demo_mode = parse_bool(env.get('DEMO_MODE'), default=False, name='DEMO_MODE')
    requested_demo_portal_access = parse_bool(
        env.get('DEMO_PORTAL_ACCESS'),
        default=False,
        name='DEMO_PORTAL_ACCESS',
    )
    raw_demo_hosts = parse_csv(env.get('DEMO_PORTAL_ALLOWED_HOSTS'))
    demo_portal_allowed_hosts = [h.lower() for h in (raw_demo_hosts or ['localhost', '127.0.0.1', 'testserver'])]

    if is_production and (requested_demo_mode or requested_demo_portal_access):
        raise ValueError(
            'DEMO_MODE and DEMO_PORTAL_ACCESS must be False when DJANGO_ENV is set to "production".'
        )

    if '*' in demo_portal_allowed_hosts:
        raise ValueError('DEMO_PORTAL_ALLOWED_HOSTS cannot contain wildcard "*".')

    # Strictly require DEBUG=True and explicit opt-in
    demo_mode = bool(debug and not is_production and requested_demo_mode)
    demo_portal_access = bool(
        debug
        and not is_production
        and demo_mode
        and requested_demo_portal_access
    )
    if requested_demo_portal_access and not demo_mode and debug and not is_production:
        warnings_list.append(
            'DEMO_PORTAL_ACCESS=True requires DEMO_MODE=True and DEBUG=True; one-click demo portal access remains disabled.'
        )

    non_local_demo_hosts = [h for h in demo_portal_allowed_hosts if not _is_approved_local_host(h)]
    if demo_portal_access and non_local_demo_hosts:
        warnings_list.append(
            f'DEMO_PORTAL_ALLOWED_HOSTS contains non-loopback host(s): {", ".join(non_local_demo_hosts)}. Restrict to localhost/127.0.0.1.'
        )

    # 11-12. COOKIE_ENCRYPTION_SECRET & REMEMBER_ME_DAYS
    raw_cookie_secret = str(env.get('COOKIE_ENCRYPTION_SECRET', '') or '').strip()
    if is_production or (not debug and not is_test_runner):
        if not raw_cookie_secret or is_placeholder_secret(raw_cookie_secret):
            raise ValueError(
                'COOKIE_ENCRYPTION_SECRET must be set to a strong, unique secret (at least 32 non-placeholder characters) in production.'
            )
        if raw_cookie_secret == secret_key:
            raise ValueError(
                'COOKIE_ENCRYPTION_SECRET must be distinct from DJANGO_SECRET_KEY.'
            )
        cookie_encryption_secret = raw_cookie_secret
    else:
        if raw_cookie_secret and raw_cookie_secret == secret_key:
            raise ValueError('COOKIE_ENCRYPTION_SECRET must be distinct from DJANGO_SECRET_KEY.')
        cookie_encryption_secret = raw_cookie_secret or DEFAULT_DEV_COOKIE_SECRET
        if not raw_cookie_secret or is_placeholder_secret(cookie_encryption_secret):
            warnings_list.append(
                'COOKIE_ENCRYPTION_SECRET is using a development fallback; set a dedicated 32+ character secret before production deployment.'
            )

    remember_me_days = parse_int_range(
        env.get('REMEMBER_ME_DAYS'),
        default=30,
        min_val=1,
        max_val=365,
        name='REMEMBER_ME_DAYS',
    )
    remember_me_max_age = remember_me_days * 86400

    # 13-18. SMTP Email Configuration
    smtp_host = str(env.get('SMTP_HOST', '') or '').strip()
    smtp_port = parse_int_range(
        env.get('SMTP_PORT'),
        default=587,
        min_val=1,
        max_val=65535,
        name='SMTP_PORT',
    )
    smtp_secure = parse_bool(
        env.get('SMTP_SECURE'),
        default=(smtp_port == 465),
        name='SMTP_SECURE',
    )
    smtp_user = str(env.get('SMTP_USER', '') or '').strip()
    smtp_pass = str(env.get('SMTP_PASS', '') or '')
    smtp_from = str(env.get('SMTP_FROM', '') or '').strip() or 'MCA Smart Campus Security <no-reply@mcasmartcampus.edu>'

    # Django forbids EMAIL_USE_SSL and EMAIL_USE_TLS both being True
    if smtp_secure or smtp_port == 465:
        email_use_ssl = True
        email_use_tls = False
    else:
        email_use_ssl = False
        email_use_tls = True

    smtp_has_auth_mismatch = bool(smtp_user) != bool(smtp_pass)
    if smtp_has_auth_mismatch:
        if is_production:
            raise ValueError('Both SMTP_USER and SMTP_PASS must be provided together when SMTP authentication is used.')
        warnings_list.append(
            'Incomplete SMTP credentials (SMTP_USER and SMTP_PASS should both be set or both left empty).'
        )

    smtp_configured = bool(smtp_host) and not smtp_has_auth_mismatch
    if is_test_runner:
        email_backend = 'django.core.mail.backends.locmem.EmailBackend'
    elif smtp_configured:
        email_backend = 'django.core.mail.backends.smtp.EmailBackend'
    else:
        email_backend = 'django.core.mail.backends.console.EmailBackend'
        if is_production:
            warnings_list.append(
                'SMTP_HOST is not configured in production; password reset emails will not be delivered externally until SMTP settings are provided.'
            )
        else:
            warnings_list.append(
                'SMTP_HOST is not configured in development; falling back to Django console email backend.'
            )

    # Secure Cookie Flags
    secure_cookies = bool((is_production or secure_ssl_redirect) and not is_test_runner)

    return {
        'DJANGO_ENV': django_env,
        'IS_PRODUCTION': is_production,
        'DEBUG': debug,
        'SECRET_KEY': secret_key,
        'ALLOWED_HOSTS': allowed_hosts,
        'CSRF_TRUSTED_ORIGINS': csrf_trusted_origins,
        'SECURE_SSL_REDIRECT': secure_ssl_redirect,
        'DATABASES': {'default': database_config},
        'DEMO_MODE': demo_mode,
        'DEMO_PORTAL_ACCESS': demo_portal_access,
        'DEMO_PORTAL_ALLOWED_HOSTS': demo_portal_allowed_hosts,
        'COOKIE_ENCRYPTION_SECRET': cookie_encryption_secret,
        'REMEMBER_ME_DAYS': remember_me_days,
        'REMEMBER_ME_MAX_AGE': remember_me_max_age,
        'REMEMBER_ME_COOKIE_NAME': 'mca_remembered_user',
        'SESSION_COOKIE_SECURE': secure_cookies,
        'CSRF_COOKIE_SECURE': secure_cookies,
        'SMTP_HOST': smtp_host,
        'SMTP_PORT': smtp_port,
        'SMTP_SECURE': smtp_secure,
        'SMTP_USER': smtp_user,
        'SMTP_FROM': smtp_from,
        'SMTP_CONFIGURED': smtp_configured,
        'EMAIL_BACKEND': email_backend,
        'EMAIL_HOST': smtp_host,
        'EMAIL_PORT': smtp_port,
        'EMAIL_USE_TLS': email_use_tls,
        'EMAIL_USE_SSL': email_use_ssl,
        'EMAIL_HOST_USER': smtp_user,
        'EMAIL_HOST_PASSWORD': smtp_pass,
        'DEFAULT_FROM_EMAIL': smtp_from,
        'SERVER_EMAIL': smtp_from,
        'EMAIL_TIMEOUT': 15,
        'CONFIG_WARNINGS': warnings_list,
    }


def run_security_audit(config: Mapping[str, object]) -> Tuple[List[Tuple[str, str]], List[Tuple[str, str]]]:
    """Run security validation checks returning (errors, warnings). Never includes secret values."""
    errors: List[Tuple[str, str]] = []
    warnings: List[Tuple[str, str]] = []

    is_prod = bool(config.get('IS_PRODUCTION'))
    debug = bool(config.get('DEBUG'))
    secret_key = str(config.get('SECRET_KEY') or '')
    cookie_secret = str(config.get('COOKIE_ENCRYPTION_SECRET') or '')
    allowed_hosts = list(config.get('ALLOWED_HOSTS') or [])
    csrf_origins = list(config.get('CSRF_TRUSTED_ORIGINS') or [])
    demo_mode = bool(config.get('DEMO_MODE'))
    demo_portal_access = bool(config.get('DEMO_PORTAL_ACCESS'))
    demo_hosts = list(config.get('DEMO_PORTAL_ALLOWED_HOSTS') or [])
    remember_days = int(config.get('REMEMBER_ME_DAYS') or 0)
    db_default = (config.get('DATABASES') or {}).get('default') or {}
    db_engine = str(db_default.get('ENGINE') or '')

    if is_prod and debug:
        errors.append(('mca_portal.E001', 'DEBUG is enabled while DJANGO_ENV=production.'))

    if is_prod and is_placeholder_secret(secret_key):
        errors.append(('mca_portal.E002', 'DJANGO_SECRET_KEY is missing, weak, or still a placeholder in production.'))

    if is_prod and (not allowed_hosts or '*' in allowed_hosts):
        errors.append(('mca_portal.E003', 'DJANGO_ALLOWED_HOSTS must list explicit production hostnames without "*".'))

    if is_prod and not csrf_origins:
        warnings.append(('mca_portal.W001', 'DJANGO_CSRF_TRUSTED_ORIGINS is empty; add your HTTPS domain(s) before production launch.'))
    elif is_prod and any(not str(o).startswith('https://') for o in csrf_origins):
        errors.append(('mca_portal.E004', 'All DJANGO_CSRF_TRUSTED_ORIGINS entries must use https:// in production.'))

    if is_prod and is_placeholder_secret(cookie_secret):
        errors.append(('mca_portal.E005', 'COOKIE_ENCRYPTION_SECRET is missing, weak, or a placeholder in production.'))

    if cookie_secret and secret_key and cookie_secret == secret_key:
        errors.append(('mca_portal.E006', 'COOKIE_ENCRYPTION_SECRET must not match DJANGO_SECRET_KEY.'))

    if remember_days < 1 or remember_days > 365:
        errors.append(('mca_portal.E007', 'REMEMBER_ME_DAYS must be between 1 and 365 days.'))

    is_test_runner = bool(config.get('IS_TEST_RUNNER', False))
    if is_prod and (demo_mode or demo_portal_access):
        errors.append(('mca_portal.E008', 'DEMO_MODE and DEMO_PORTAL_ACCESS must be disabled in production.'))
    elif not debug and not is_test_runner and (demo_mode or demo_portal_access):
        errors.append(('mca_portal.E008', 'DEMO_MODE and DEMO_PORTAL_ACCESS must be disabled in non-debug environments.'))

    if demo_portal_access and any(not _is_approved_local_host(str(h)) for h in demo_hosts):
        warnings.append(('mca_portal.W002', 'DEMO_PORTAL_ALLOWED_HOSTS includes non-local hosts. Restrict to localhost/127.0.0.1.'))

    if is_prod and not bool(config.get('SESSION_COOKIE_SECURE')):
        errors.append(('mca_portal.E009', 'SESSION_COOKIE_SECURE must be True in production.'))

    if is_prod and not bool(config.get('CSRF_COOKIE_SECURE')):
        errors.append(('mca_portal.E010', 'CSRF_COOKIE_SECURE must be True in production.'))

    if bool(config.get('EMAIL_USE_TLS')) and bool(config.get('EMAIL_USE_SSL')):
        errors.append(('mca_portal.E011', 'EMAIL_USE_TLS and EMAIL_USE_SSL cannot both be True simultaneously.'))

    if is_prod and not bool(config.get('SMTP_CONFIGURED')):
        warnings.append(('mca_portal.W003', 'SMTP_HOST is not configured; password reset emails will not send in production.'))

    if is_prod and db_engine == 'django.db.backends.sqlite3':
        warnings.append(('mca_portal.W004', 'Production is using SQLite; configure DATABASE_URL with PostgreSQL for multi-worker deployments.'))

    return errors, warnings
