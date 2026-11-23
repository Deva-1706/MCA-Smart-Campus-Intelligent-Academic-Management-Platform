"""Standalone Python unit tests verifying all 18 MCA Smart Campus Django env settings,
DATABASE_URL parsing, encrypted Remember-Me cookies, SMTP modes, demo access guards,
and deployment security checks.
"""

from __future__ import annotations

import os
import sqlite3
import tempfile
import unittest
from pathlib import Path

from mca_portal.env_config import (
    build_django_config,
    load_project_dotenv,
    parse_database_url,
    run_security_audit,
)
from mca_portal.security import decrypt_cookie_value, encrypt_cookie_value

BASE_DIR = Path(__file__).resolve().parent.parent

STRONG_DJANGO_SECRET = 'p9Xq2Lm8Vr4Kt7Wz1Bn6Ch3Df5Gj8Kl0Mn2Pq4Rs6Tu8Vw0Xy2Za4Bc6De8Fg'
STRONG_COOKIE_SECRET = 'K7mN2pQ9rT4vW6xY8zA1bC3dE5fG7hJ9kL2mN4pQ6rS8tU0vW2xY4zA6bC8d'


class DjangoEnvConfigTests(unittest.TestCase):
    def test_01_development_settings_load_cleanly_with_explicit_demo_defaults(self):
        cfg = build_django_config({}, BASE_DIR)
        self.assertEqual(cfg['DJANGO_ENV'], 'development')
        self.assertTrue(cfg['DEBUG'])
        self.assertEqual(cfg['ALLOWED_HOSTS'], ['localhost', '127.0.0.1', 'testserver'])
        self.assertFalse(cfg['SECURE_SSL_REDIRECT'])
        self.assertFalse(cfg['DEMO_MODE'])
        self.assertFalse(cfg['DEMO_PORTAL_ACCESS'])
        self.assertEqual(cfg['REMEMBER_ME_DAYS'], 30)
        self.assertEqual(cfg['REMEMBER_ME_MAX_AGE'], 30 * 86400)
        self.assertEqual(cfg['DATABASES']['default']['ENGINE'], 'django.db.backends.sqlite3')
        self.assertEqual(cfg['EMAIL_BACKEND'], 'django.core.mail.backends.console.EmailBackend')
        # Missing SMTP in dev warns clearly without crashing
        self.assertTrue(any('SMTP_HOST' in w for w in cfg['CONFIG_WARNINGS']))

    def test_02_production_settings_validate_and_pass_security_audit(self):
        prod_env = {
            'DJANGO_ENV': 'production',
            'DJANGO_DEBUG': 'False',
            'DJANGO_SECRET_KEY': STRONG_DJANGO_SECRET,
            'DJANGO_ALLOWED_HOSTS': 'campus.university.edu,www.campus.university.edu',
            'DJANGO_CSRF_TRUSTED_ORIGINS': 'https://campus.university.edu,https://www.campus.university.edu',
            'DJANGO_SECURE_SSL_REDIRECT': 'True',
            'DATABASE_URL': 'postgresql://campus_app:s3cr3tPass@db.internal:5432/mca_prod?sslmode=require',
            'DEMO_MODE': 'False',
            'DEMO_PORTAL_ACCESS': 'False',
            'DEMO_PORTAL_ALLOWED_HOSTS': 'localhost,127.0.0.1',
            'COOKIE_ENCRYPTION_SECRET': STRONG_COOKIE_SECRET,
            'REMEMBER_ME_DAYS': '14',
            'SMTP_HOST': 'smtp.university.edu',
            'SMTP_PORT': '587',
            'SMTP_SECURE': 'false',
            'SMTP_USER': 'mailer@university.edu',
            'SMTP_PASS': 'app-password-value',
            'SMTP_FROM': 'MCA Smart Campus <no-reply@university.edu>',
        }
        cfg = build_django_config(prod_env, BASE_DIR)
        errors, warnings = run_security_audit(cfg)
        self.assertEqual(errors, [])
        self.assertEqual(warnings, [])
        self.assertFalse(cfg['DEBUG'])
        self.assertTrue(cfg['SECURE_SSL_REDIRECT'])
        self.assertTrue(cfg['SESSION_COOKIE_SECURE'])
        self.assertTrue(cfg['CSRF_COOKIE_SECURE'])
        self.assertEqual(cfg['REMEMBER_ME_DAYS'], 14)
        self.assertEqual(cfg['EMAIL_BACKEND'], 'django.core.mail.backends.smtp.EmailBackend')
        self.assertTrue(cfg['EMAIL_USE_TLS'])
        self.assertFalse(cfg['EMAIL_USE_SSL'])
        self.assertEqual(cfg['DATABASES']['default']['ENGINE'], 'django.db.backends.postgresql')
        self.assertEqual(cfg['DATABASES']['default']['NAME'], 'mca_prod')
        self.assertEqual(cfg['DATABASES']['default']['HOST'], 'db.internal')
        self.assertEqual(cfg['DATABASES']['default']['OPTIONS'].get('sslmode'), 'require')

    def test_03_production_rejects_unsafe_configs_and_never_leaks_secrets(self):
        base_prod = {
            'DJANGO_ENV': 'production',
            'DJANGO_DEBUG': 'False',
            'DJANGO_SECRET_KEY': STRONG_DJANGO_SECRET,
            'DJANGO_ALLOWED_HOSTS': 'campus.university.edu',
            'DJANGO_CSRF_TRUSTED_ORIGINS': 'https://campus.university.edu',
            'COOKIE_ENCRYPTION_SECRET': STRONG_COOKIE_SECRET,
        }

        # DEBUG=True in production rejected
        with self.assertRaises(ValueError):
            build_django_config({**base_prod, 'DJANGO_DEBUG': 'True'}, BASE_DIR)

        # Missing or placeholder DJANGO_SECRET_KEY rejected without echoing value
        with self.assertRaises(ValueError) as ctx:
            build_django_config({**base_prod, 'DJANGO_SECRET_KEY': 'CHANGE_ME_TO_A_50_PLUS_CHAR_RANDOM_SECRET'}, BASE_DIR)
        self.assertNotIn('CHANGE_ME_TO_A_50_PLUS_CHAR_RANDOM_SECRET', str(ctx.exception))

        # Empty or wildcard ALLOWED_HOSTS rejected
        with self.assertRaises(ValueError):
            build_django_config({**base_prod, 'DJANGO_ALLOWED_HOSTS': ''}, BASE_DIR)
        with self.assertRaises(ValueError):
            build_django_config({**base_prod, 'DJANGO_ALLOWED_HOSTS': '*'}, BASE_DIR)

        # Non-HTTPS CSRF origin rejected in production
        with self.assertRaises(ValueError):
            build_django_config({**base_prod, 'DJANGO_CSRF_TRUSTED_ORIGINS': 'http://campus.university.edu'}, BASE_DIR)

        # COOKIE_ENCRYPTION_SECRET matching DJANGO_SECRET_KEY rejected
        with self.assertRaises(ValueError):
            build_django_config({**base_prod, 'COOKIE_ENCRYPTION_SECRET': STRONG_DJANGO_SECRET}, BASE_DIR)

        # DEMO_MODE or DEMO_PORTAL_ACCESS enabled in production rejected
        with self.assertRaises(ValueError):
            build_django_config({**base_prod, 'DEMO_MODE': 'True'}, BASE_DIR)
        with self.assertRaises(ValueError):
            build_django_config({**base_prod, 'DEMO_PORTAL_ACCESS': 'True'}, BASE_DIR)

    def test_04_database_url_sqlite_and_postgresql_validation(self):
        # Empty -> SQLite db.sqlite3
        sqlite_cfg = parse_database_url('', BASE_DIR, is_production=False)
        self.assertEqual(sqlite_cfg['ENGINE'], 'django.db.backends.sqlite3')
        self.assertEqual(Path(sqlite_cfg['NAME']).name, 'db.sqlite3')

        # Live SQLite connection works cleanly in temp file (preserves real db.sqlite3 untouched)
        with tempfile.TemporaryDirectory() as tmp:
            tmp_db = Path(tmp) / 'verify.sqlite3'
            conn = sqlite3.connect(str(tmp_db))
            conn.execute('CREATE TABLE probe (id INTEGER PRIMARY KEY, label TEXT)')
            conn.execute("INSERT INTO probe (label) VALUES ('intact')")
            conn.commit()
            row = conn.execute('SELECT label FROM probe').fetchone()
            conn.close()
            self.assertEqual(row, ('intact',))

        # PostgreSQL URL parsed accurately
        pg_cfg = parse_database_url('postgres://user1:pw1@pg.host:5433/campusdb', BASE_DIR, is_production=True)
        self.assertEqual(pg_cfg['ENGINE'], 'django.db.backends.postgresql')
        self.assertEqual(pg_cfg['NAME'], 'campusdb')
        self.assertEqual(pg_cfg['HOST'], 'pg.host')
        self.assertEqual(str(pg_cfg['PORT']), '5433')
        self.assertEqual(pg_cfg['OPTIONS'].get('sslmode'), 'require')

        # Malformed or unsupported DATABASE_URL rejected at startup
        with self.assertRaises(ValueError):
            parse_database_url('mysql://user:pass@localhost/db', BASE_DIR)
        with self.assertRaises(ValueError):
            parse_database_url('postgresql://user:pass@localhost/', BASE_DIR)

    def test_05_smtp_starttls_587_and_ssl_465_configuration(self):
        # STARTTLS on port 587
        cfg_tls = build_django_config(
            {
                'SMTP_HOST': 'smtp.example.org',
                'SMTP_PORT': '587',
                'SMTP_SECURE': 'false',
                'SMTP_USER': 'sender@example.org',
                'SMTP_PASS': 'secret-smtp-pass',
                'SMTP_FROM': 'Campus <sender@example.org>',
            },
            BASE_DIR,
        )
        self.assertTrue(cfg_tls['SMTP_CONFIGURED'])
        self.assertTrue(cfg_tls['EMAIL_USE_TLS'])
        self.assertFalse(cfg_tls['EMAIL_USE_SSL'])
        self.assertEqual(cfg_tls['EMAIL_PORT'], 587)
        self.assertEqual(cfg_tls['EMAIL_BACKEND'], 'django.core.mail.backends.smtp.EmailBackend')

        # Implicit SSL on port 465
        cfg_ssl = build_django_config(
            {
                'SMTP_HOST': 'smtp.example.org',
                'SMTP_PORT': '465',
                'SMTP_SECURE': 'true',
                'SMTP_USER': 'sender@example.org',
                'SMTP_PASS': 'secret-smtp-pass',
            },
            BASE_DIR,
        )
        self.assertTrue(cfg_ssl['SMTP_CONFIGURED'])
        self.assertFalse(cfg_ssl['EMAIL_USE_TLS'])
        self.assertTrue(cfg_ssl['EMAIL_USE_SSL'])
        self.assertEqual(cfg_ssl['EMAIL_PORT'], 465)

        # Ensure secrets never appear in warnings
        for warn in cfg_tls['CONFIG_WARNINGS'] + cfg_ssl['CONFIG_WARNINGS']:
            self.assertNotIn('secret-smtp-pass', warn)

    def test_06_demo_portal_access_strict_opt_in_and_local_host_restrictions(self):
        # Opting into DEMO_PORTAL_ACCESS without DEMO_MODE keeps it disabled
        cfg_partial = build_django_config(
            {'DJANGO_ENV': 'development', 'DJANGO_DEBUG': 'True', 'DEMO_PORTAL_ACCESS': 'True'},
            BASE_DIR,
        )
        self.assertFalse(cfg_partial['DEMO_PORTAL_ACCESS'])

        # Explicit opt-in in local dev works
        cfg_enabled = build_django_config(
            {
                'DJANGO_ENV': 'development',
                'DJANGO_DEBUG': 'True',
                'DEMO_MODE': 'True',
                'DEMO_PORTAL_ACCESS': 'True',
                'DEMO_PORTAL_ALLOWED_HOSTS': 'localhost,127.0.0.1',
            },
            BASE_DIR,
        )
        self.assertTrue(cfg_enabled['DEMO_MODE'])
        self.assertTrue(cfg_enabled['DEMO_PORTAL_ACCESS'])
        self.assertEqual(cfg_enabled['DEMO_PORTAL_ALLOWED_HOSTS'], ['localhost', '127.0.0.1'])

        # Wildcard demo host rejected
        with self.assertRaises(ValueError):
            build_django_config(
                {
                    'DJANGO_ENV': 'development',
                    'DJANGO_DEBUG': 'True',
                    'DEMO_MODE': 'True',
                    'DEMO_PORTAL_ACCESS': 'True',
                    'DEMO_PORTAL_ALLOWED_HOSTS': '*',
                },
                BASE_DIR,
            )

    def test_07_encrypted_remember_me_cookie_roundtrip_and_tamper_resistance(self):
        token = encrypt_cookie_value('MCA2401', STRONG_COOKIE_SECRET, max_age_seconds=3600)
        self.assertTrue(token.startswith('v1.'))
        self.assertNotIn('MCA2401', token)
        self.assertEqual(decrypt_cookie_value(token, STRONG_COOKIE_SECRET), 'MCA2401')

        # Wrong secret fails decryption
        self.assertIsNone(decrypt_cookie_value(token, STRONG_DJANGO_SECRET))

        # Tampered token fails MAC verification
        tampered = token[:-4] + ('AAAA' if not token.endswith('AAAA') else 'BBBB')
        self.assertIsNone(decrypt_cookie_value(tampered, STRONG_COOKIE_SECRET))

    def test_08_dotenv_loader_does_not_overwrite_existing_environment_variables(self):
        with tempfile.TemporaryDirectory() as tmp:
            env_file = Path(tmp) / '.env'
            env_file.write_text('MCA_TEST_DOTENV_A="from_file"\nMCA_TEST_DOTENV_B="from_file"\n', encoding='utf-8')
            os.environ['MCA_TEST_DOTENV_A'] = 'from_os'
            os.environ.pop('MCA_TEST_DOTENV_B', None)
            try:
                loaded = load_project_dotenv(Path(tmp))
                self.assertTrue(loaded)
                self.assertEqual(os.environ.get('MCA_TEST_DOTENV_A'), 'from_os')
                self.assertEqual(os.environ.get('MCA_TEST_DOTENV_B'), 'from_file')
            finally:
                os.environ.pop('MCA_TEST_DOTENV_A', None)
                os.environ.pop('MCA_TEST_DOTENV_B', None)

    def test_09_env_example_and_gitignore_completeness(self):
        env_example_text = (BASE_DIR / '.env.example').read_text(encoding='utf-8')
        required_vars = [
            'DJANGO_ENV',
            'DJANGO_DEBUG',
            'DJANGO_SECRET_KEY',
            'DJANGO_ALLOWED_HOSTS',
            'DJANGO_CSRF_TRUSTED_ORIGINS',
            'DJANGO_SECURE_SSL_REDIRECT',
            'DATABASE_URL',
            'DEMO_MODE',
            'DEMO_PORTAL_ACCESS',
            'DEMO_PORTAL_ALLOWED_HOSTS',
            'COOKIE_ENCRYPTION_SECRET',
            'REMEMBER_ME_DAYS',
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_SECURE',
            'SMTP_USER',
            'SMTP_PASS',
            'SMTP_FROM',
        ]
        for var in required_vars:
            self.assertIn(f'{var}=', env_example_text, f'Missing {var} in .env.example')

        gitignore_text = (BASE_DIR / '.gitignore').read_text(encoding='utf-8')
        for pattern in ('.env', '!.env.example', '*.pem', '*.key', '*.sql', 'backups/', 'staticfiles/', '__pycache__/'):
            self.assertIn(pattern, gitignore_text, f'Missing {pattern} in .gitignore')

        # Static source files exist for collectstatic
        self.assertTrue((BASE_DIR / 'static' / 'css' / 'style.css').is_file())


if __name__ == '__main__':
    unittest.main()
