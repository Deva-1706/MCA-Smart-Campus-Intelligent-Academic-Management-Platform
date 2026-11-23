"""WSGI config for mca_portal project."""

import os
from pathlib import Path

from mca_portal.env_config import load_project_dotenv

load_project_dotenv(Path(__file__).resolve().parent.parent)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mca_portal.settings')

from django.core.wsgi import get_wsgi_application  # noqa: E402

application = get_wsgi_application()
