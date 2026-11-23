#!/usr/bin/env python3
"""Django's command-line utility for administrative tasks."""
import os
import sqlite3
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def _run_standalone_diagnostics(argv):
    """Run real environment, DB, migration, and security checks when Django is not installed."""
    from mca_portal.env_config import build_django_config, load_project_dotenv, run_security_audit

    load_project_dotenv(BASE_DIR)
    cmd = argv[1] if len(argv) > 1 else ''
    is_deploy = '--deploy' in argv[2:]

    if cmd == 'check':
        try:
            cfg = build_django_config(os.environ, BASE_DIR, is_test_runner=False)
        except ValueError as exc:
            print(f'SystemCheckError: Configuration error: {exc}', file=sys.stderr)
            sys.exit(1)

        errors, warnings = run_security_audit(cfg)
        if is_deploy and cfg.get('DJANGO_ENV') != 'production':
            warnings.append(
                (
                    'mca_portal.W006',
                    'DJANGO_ENV is not set to "production". Set DJANGO_ENV=production and DJANGO_DEBUG=False before deploying.',
                )
            )

        print('Note: Django package is not installed in this Python interpreter; running standalone MCA config & security checks.')
        for code, msg in errors:
            print(f'ERROR ({code}): {msg}')
        for code, msg in warnings:
            print(f'WARNING ({code}): {msg}')

        total = len(errors) + len(warnings)
        print(f'Standalone system check identified {total} issue(s) ({len(errors)} error(s), {len(warnings)} warning(s)).')
        if errors:
            sys.exit(1)
        return

    if cmd == 'showmigrations':
        migrations_dir = BASE_DIR / 'mca_portal' / 'migrations'
        migration_files = sorted(
            p.stem for p in migrations_dir.glob('[0-9]*.py') if p.is_file()
        )
        applied = set()
        db_path = BASE_DIR / 'db.sqlite3'
        if db_path.is_file():
            try:
                conn = sqlite3.connect(str(db_path))
                rows = conn.execute(
                    "SELECT name FROM django_migrations WHERE app = 'mca_portal'"
                ).fetchall()
                applied = {r[0] for r in rows}
                conn.close()
            except sqlite3.Error:
                pass
        print('Note: Django package is not installed in this Python interpreter; inspecting mca_portal/migrations/ directly.')
        print('mca_portal')
        for name in migration_files:
            mark = 'X' if name in applied else ' '
            print(f' [{mark}] {name}')
        return

    print(
        'Error: Django is not installed in the active Python environment. '
        'Install dependencies via: pip install -r requirements.txt',
        file=sys.stderr,
    )
    sys.exit(1)


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mca_portal.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError:
        _run_standalone_diagnostics(sys.argv)
        return
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
