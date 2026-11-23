#!/usr/bin/env python3
"""Non-destructive SQLite backup & recovery verification utility for MCA Smart Campus.

Uses Python's built-in sqlite3 online backup API (.backup()), computes a SHA-256
digest, runs PRAGMA integrity_check and PRAGMA foreign_key_check against an
isolated restore copy in /tmp, and verifies table & row count parity against the
source database without touching or mutating the primary database.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import sqlite3
import sys
import tempfile
from pathlib import Path


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as fh:
        for chunk in iter(lambda: fh.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()


def collect_table_counts(db_path: Path) -> dict[str, int]:
    conn = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        tables = [row[0] for row in cur.fetchall()]
        counts: dict[str, int] = {}
        for tbl in tables:
            cur.execute(f'SELECT COUNT(*) FROM "{tbl}"')
            counts[tbl] = int(cur.fetchone()[0])
        return counts
    finally:
        conn.close()


def backup_and_verify(source_db: Path, backup_dir: Path | None = None, keep_backup: bool = False) -> dict:
    if not source_db.exists():
        raise FileNotFoundError(f'Source database not found: {source_db}')

    temp_root = Path(tempfile.mkdtemp(prefix='mca_backup_verify_'))
    target_dir = backup_dir if backup_dir else temp_root
    target_dir.mkdir(parents=True, exist_ok=True)
    backup_file = target_dir / f'{source_db.stem}_backup.sqlite3'
    restore_file = temp_root / f'{source_db.stem}_restore_verify.sqlite3'

    try:
        src_conn = sqlite3.connect(f'file:{source_db}?mode=ro', uri=True)
        bak_conn = sqlite3.connect(str(backup_file))
        try:
            src_conn.backup(bak_conn)
        finally:
            bak_conn.close()
            src_conn.close()

        checksum = sha256_file(backup_file)
        shutil.copy2(backup_file, restore_file)

        res_conn = sqlite3.connect(str(restore_file))
        try:
            cur = res_conn.cursor()
            cur.execute('PRAGMA integrity_check')
            integrity = cur.fetchone()[0]
            cur.execute('PRAGMA foreign_key_check')
            fk_issues = cur.fetchall()
        finally:
            res_conn.close()

        source_counts = collect_table_counts(source_db)
        restored_counts = collect_table_counts(restore_file)
        parity_ok = source_counts == restored_counts and integrity == 'ok' and len(fk_issues) == 0

        return {
            'source': str(source_db),
            'backup_file': str(backup_file) if keep_backup else '<cleaned-temp>',
            'sha256': checksum,
            'size_bytes': backup_file.stat().st_size,
            'integrity_check': integrity,
            'foreign_key_issues': len(fk_issues),
            'tables_verified': len(source_counts),
            'total_rows_verified': sum(source_counts.values()),
            'parity_ok': parity_ok,
        }
    finally:
        if not keep_backup and temp_root.exists():
            shutil.rmtree(temp_root, ignore_errors=True)
        elif restore_file.exists():
            shutil.rmtree(temp_root, ignore_errors=True)


def run_synthetic_verification() -> dict:
    with tempfile.TemporaryDirectory(prefix='mca_synthetic_db_') as tmp:
        synth_db = Path(tmp) / 'synthetic_mca.sqlite3'
        conn = sqlite3.connect(str(synth_db))
        try:
            conn.executescript(
                """
                PRAGMA foreign_keys = ON;
                CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, role TEXT NOT NULL);
                CREATE TABLE notices (id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER REFERENCES users(id));
                INSERT INTO users (id, username, role) VALUES (1, 'admin', 'ADMIN'), (2, 'student1', 'STUDENT');
                INSERT INTO notices (id, title, author_id) VALUES (1, 'Exam Schedule', 1);
                """
            )
            conn.commit()
        finally:
            conn.close()
        return backup_and_verify(synth_db, keep_backup=False)


def main() -> int:
    parser = argparse.ArgumentParser(description='MCA Smart Campus SQLite Backup & Verification')
    parser.add_argument('--source', type=Path, default=Path('db.sqlite3'), help='Path to source SQLite database')
    parser.add_argument('--backup-dir', type=Path, default=None, help='Directory to store verified backup file')
    parser.add_argument('--keep', action='store_true', help='Keep the generated backup file after verification')
    parser.add_argument(
        '--verify-synthetic',
        action='store_true',
        help='Create and verify a temporary synthetic SQLite DB in /tmp when no local db.sqlite3 is present',
    )
    args = parser.parse_args()

    try:
        if args.verify_synthetic:
            report = run_synthetic_verification()
        else:
            report = backup_and_verify(args.source, backup_dir=args.backup_dir, keep_backup=args.keep)
        for k, v in report.items():
            print(f'{k}: {v}')
        return 0 if report.get('parity_ok') else 1
    except Exception as exc:
        print(f'Backup/verification failed: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
