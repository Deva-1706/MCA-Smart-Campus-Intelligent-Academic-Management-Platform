"""Django application configuration for MCA Smart Campus."""

from django.apps import AppConfig


class McaPortalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'mca_portal'
    verbose_name = 'MCA Smart Campus Portal'

    def ready(self):
        # Register deployment and environment security checks
        from . import checks  # noqa: F401
