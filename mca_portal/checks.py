"""Django system checks for MCA Smart Campus environment & deployment security."""

from django.conf import settings
from django.core.checks import Error, Tags, Warning, register

from .env_config import run_security_audit


def _snapshot_django_settings():
    return {
        'IS_TEST_RUNNER': getattr(settings, 'IS_TEST_RUNNER', False),
        'DJANGO_ENV': getattr(settings, 'DJANGO_ENV', 'development'),
        'IS_PRODUCTION': getattr(settings, 'DJANGO_ENV', 'development') == 'production',
        'DEBUG': getattr(settings, 'DEBUG', False),
        'SECRET_KEY': getattr(settings, 'SECRET_KEY', ''),
        'ALLOWED_HOSTS': getattr(settings, 'ALLOWED_HOSTS', []),
        'CSRF_TRUSTED_ORIGINS': getattr(settings, 'CSRF_TRUSTED_ORIGINS', []),
        'DATABASES': getattr(settings, 'DATABASES', {}),
        'DEMO_MODE': getattr(settings, 'DEMO_MODE', False),
        'DEMO_PORTAL_ACCESS': getattr(settings, 'DEMO_PORTAL_ACCESS', False),
        'DEMO_PORTAL_ALLOWED_HOSTS': getattr(settings, 'DEMO_PORTAL_ALLOWED_HOSTS', []),
        'COOKIE_ENCRYPTION_SECRET': getattr(settings, 'COOKIE_ENCRYPTION_SECRET', ''),
        'REMEMBER_ME_DAYS': getattr(settings, 'REMEMBER_ME_DAYS', 30),
        'SESSION_COOKIE_SECURE': getattr(settings, 'SESSION_COOKIE_SECURE', False),
        'CSRF_COOKIE_SECURE': getattr(settings, 'CSRF_COOKIE_SECURE', False),
        'EMAIL_USE_TLS': getattr(settings, 'EMAIL_USE_TLS', False),
        'EMAIL_USE_SSL': getattr(settings, 'EMAIL_USE_SSL', False),
        'SMTP_CONFIGURED': getattr(settings, 'SMTP_CONFIGURED', False),
    }


@register(Tags.security)
def check_mca_environment_security(app_configs, **kwargs):
    """Validate runtime environment invariants without exposing secrets."""
    messages = []
    errors, warnings = run_security_audit(_snapshot_django_settings())

    if not getattr(settings, 'SESSION_COOKIE_HTTPONLY', False):
        messages.append(
            Error(
                'SESSION_COOKIE_HTTPONLY must be enabled.',
                id='mca_portal.E012',
            )
        )

    for code, text in errors:
        messages.append(Error(text, id=code))
    for code, text in warnings:
        messages.append(Warning(text, id=code))

    return messages


@register(Tags.security, deploy=True)
def check_mca_deployment_readiness(app_configs, **kwargs):
    """Additional checks executed during `manage.py check --deploy`."""
    messages = []
    if not getattr(settings, 'SECURE_CONTENT_TYPE_NOSNIFF', False):
        messages.append(Warning('SECURE_CONTENT_TYPE_NOSNIFF should be True.', id='mca_portal.W005'))
    if getattr(settings, 'DJANGO_ENV', 'development') != 'production':
        messages.append(
            Warning(
                'DJANGO_ENV is not set to "production". Set DJANGO_ENV=production and DJANGO_DEBUG=False before deploying.',
                id='mca_portal.W006',
            )
        )
    return messages
