# MCA Smart Campus — Production Deployment, Backup & Database Migration Runbook

## 1. Environment Configuration Checklist
Copy `.env.example` to `.env` (never commit real secrets) and set all production variables before launching:

| Variable | Purpose | Production Requirement |
| --- | --- | --- |
| `DJANGO_ENV` | Runtime mode selector (`development` or `production`) | Set to `production` to enforce secret, cookie, and host guards |
| `DJANGO_DEBUG` | Django debug traceback toggle | Must be `False` in production |
| `DJANGO_SECRET_KEY` | Cryptographic signing key | Required in production (50+ random non-placeholder chars) |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames | Explicit domain(s), e.g. `campus.example.edu` (never `*`) |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Origin whitelist for HTTPS POST | Explicit `https://` origin(s), e.g. `https://campus.example.edu` |
| `DJANGO_SECURE_SSL_REDIRECT` | Force HTTP -> HTTPS redirect | `True` behind TLS-terminating reverse proxy |
| `DATABASE_URL` | PostgreSQL DSN (or unset for local SQLite) | Set `postgresql://...` with SSL for multi-worker production |
| `DEMO_MODE` | Local demo environment opt-in | Must be `False` in production |
| `DEMO_PORTAL_ACCESS` | Development-only one-click portal selector | Must be `False` in production (requires `DEBUG=True` + `DEMO_MODE=True`) |
| `DEMO_PORTAL_ALLOWED_HOSTS` | Local dev host allowlist for demo portal | Keep restricted to `localhost,127.0.0.1,testserver` |
| `COOKIE_ENCRYPTION_SECRET` | Dedicated Remember-Me cookie encryption key | Required in production (32+ random chars, distinct from `DJANGO_SECRET_KEY`) |
| `REMEMBER_ME_DAYS` | Remember-Me session & cookie lifetime (1-365) | Recommended `14`–`30` days |
| `SMTP_HOST` | Outgoing SMTP server hostname | Required for external password reset email delivery |
| `SMTP_PORT` | SMTP port (`587` STARTTLS / `465` SSL) | Match your mail provider (`587` or `465`) |
| `SMTP_SECURE` | Implicit TLS/SSL toggle (`true` for 465, `false` for 587) | Set `true` for port 465 SSL, `false` for port 587 STARTTLS |
| `SMTP_USER` | SMTP authentication username | Store in secret manager; never commit |
| `SMTP_PASS` | SMTP authentication password / app password | Store in secret manager; never commit or log |
| `SMTP_FROM` | Sender display name and address | Verified domain sender (e.g. `no-reply@yourdomain.edu`) |
| `GEMINI_API_KEY` | Server-side Gemini API key | Kept server-side only; passed via `x-goog-api-key` header |

Health check endpoint: `GET /health/` verifies live database connectivity (`SELECT 1`) and returns HTTP `200` without exposing secrets.

---

## 2. Production Django + Express Stack Setup

### 2.1 Django Application Server (WSGI / ASGI)
Install Python dependencies (`requirements.txt`):
```bash
pip install -r requirements.txt
```
Apply database migrations and collect static assets into `STATIC_ROOT` (`staticfiles/`):
```bash
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py check --deploy
```
Serve Django with Gunicorn:
```bash
gunicorn mca_portal.wsgi:application \
  --bind 127.0.0.1:8000 \
  --workers 3 \
  --timeout 60 \
  --access-logfile - \
  --error-logfile -
```
For ASGI deployments (optional):
```bash
uvicorn mca_portal.asgi:application --host 127.0.0.1 --port 8000 --workers 2
```

### 2.2 Express + Vite Production Bundle
Build frontend assets and run the hardened Express server on port `3000`:
```bash
npm ci
npm run build
NODE_ENV=production npm start
```
Runtime protections active in `server.ts`:
- Global HTTP response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: same-origin`, `Cross-Origin-Opener-Policy: same-origin`).
- `Cache-Control: no-store` on `/api/auth/*` and `/api/admin/*`.
- Authentication gates on all `/api/gemini/*` endpoints and `/api/coding-lab/execute`.
- Isolated subprocess Python runner with AST policy enforcement, `tempfile.mkdtempSync` empty working directory, scrubbed environment, and `resource` CPU/file-size limits.
- Sanitized upstream AI error messages (no raw stack traces or provider secrets returned to clients).

### 2.3 Nginx Reverse Proxy & File Protection
- Serve `STATIC_ROOT` (`/static/`) directly via Nginx with `expires 30d; add_header Cache-Control "public, immutable";`.
- **Do NOT** expose `MEDIA_ROOT` (`media/`) directly via static Nginx `alias`/`location` or directory autoindex. All study material and notice attachments are served exclusively through role-checked Django views:
  - `/portal/materials/download/<int:material_id>/`
  - `/portal/notices/download/<int:notice_id>/`
  These enforce `@login_required`, `is_active`, canonical path traversal confinement (`Path.resolve().relative_to(MEDIA_ROOT)`), and `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff`.
- Terminate TLS 1.2/1.3 at Nginx, forward `X-Forwarded-Proto: https` and `Host`, and enable HSTS (`SECURE_HSTS_SECONDS = 31536000`).

---

## 3. SQLite Online Backup & Integrity Verification
Use the provided non-destructive CLI utility `scripts/backup_and_verify.py`, which uses Python's `sqlite3.Connection.backup()` online snapshot API (safe during active reads/writes), records SHA-256 checksums, restores into an isolated temporary database, and verifies `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, and table row parity:

```bash
# Create & verify a timestamped backup of the live SQLite database
python3 scripts/backup_and_verify.py --source db.sqlite3 --dest-dir backups/

# Self-test the backup & restore pipeline using an ephemeral synthetic database
python3 scripts/backup_and_verify.py --verify-synthetic
```

### Point-in-Time Recovery Procedure
1. Quiesce application writers (`systemctl stop gunicorn`).
2. Verify backup archive checksum and SQLite integrity using `python3 scripts/backup_and_verify.py` or `sqlite3 backup.sqlite3 "PRAGMA integrity_check;"`.
3. Preserve the damaged database (`mv db.sqlite3 db.sqlite3.corrupt.<timestamp>`) before restoring (`cp backups/mca_backup_<ts>.sqlite3 db.sqlite3`).
4. Run `python manage.py check` and restart services (`systemctl start gunicorn`).

---

## 4. Planned PostgreSQL Migration Guide (Non-Executed Plan)
The live deployment currently operates on SQLite (`db.sqlite3`) by default unless `DATABASE_URL` is configured. **Do not execute schema cutover during live student assessments.** When ready to migrate to managed PostgreSQL (or Google Cloud SQL for PostgreSQL), follow this staged plan:

### Stage A — Pre-Flight & Provisioning
1. Freeze content/user mutations briefly (maintenance banner / read-only window).
2. Create an online verified SQLite snapshot:
   ```bash
   python3 scripts/backup_and_verify.py --source db.sqlite3 --dest-dir backups/pre_pg_migration/
   ```
3. Provision PostgreSQL 15+ database and dedicated least-privilege application role:
   ```sql
   CREATE ROLE mca_app WITH LOGIN PASSWORD '<STRONG_GENERATED_PASSWORD>';
   CREATE DATABASE mca_smart_campus OWNER mca_app ENCODING 'UTF8';
   ```

### Stage B — Export Logical Snapshot from SQLite
With `DATABASE_URL` unset (pointing at verified SQLite):
```bash
python manage.py dumpdata \
  --natural-foreign \
  --natural-primary \
  --exclude contenttypes \
  --exclude auth.permission \
  --indent 2 \
  -o backups/pre_pg_migration/django_fixture.json
```

### Stage C — Apply Django Schema & Indexes to PostgreSQL
1. Install driver (`psycopg[binary]` is listed in `requirements.txt`).
2. Export `DATABASE_URL=postgres://mca_app:<PASSWORD>@<HOST>:5432/mca_smart_campus?sslmode=require`.
3. Run migrations cleanly against PostgreSQL (creates tables + all composite indexes from `0002_performance_indexes.py`):
   ```bash
   python manage.py migrate --noinput
   ```

### Stage D — Load Data & Reset Sequences
1. Import logical fixture:
   ```bash
   python manage.py loaddata backups/pre_pg_migration/django_fixture.json
   ```
2. Reset PostgreSQL `SERIAL`/`IDENTITY` sequences (`sqlsequencereset`):
   ```bash
   python manage.py sqlsequencereset mca_portal auth | python manage.py dbshell
   ```

### Stage E — Parity Checks & Cutover
1. Verify row counts across key models (`StudentProfile`, `Subject`, `StudyMaterial`, `Assignment`, `Submission`, `Examination`, `ExamResult`, `ImportantNotice`, `AuditLog`) match pre-migration SQLite counts.
2. Run smoke checks:
   - Role login (`/admin-login/`, `/faculty-login/`, `/student-login/`)
   - Protected material attachment download
   - Coding Lab AST sandbox execution
   - Assignment evaluation transaction write
3. Run `python manage.py check --deploy` and promote application traffic.

### Stage F — Instant Rollback Plan (If Any Parity Anomaly Occurs)
1. Stop Gunicorn workers.
2. Unset `DATABASE_URL` so `mca_portal/settings.py` reverts to `backups/pre_pg_migration/` verified SQLite file `db.sqlite3`.
3. Restart Gunicorn and confirm health endpoints return HTTP 200.
