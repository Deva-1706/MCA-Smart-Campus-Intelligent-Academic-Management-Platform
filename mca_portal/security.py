"""Security, validation, and sandbox helpers for MCA Smart Campus (Django)."""

from __future__ import annotations

import ast
import datetime
import os
import re
import subprocess
import sys
import tempfile
import uuid
from typing import Iterable, Optional, Tuple


FORBIDDEN_MODULES = {
    'os',
    'subprocess',
    'socket',
    'shutil',
    'ctypes',
    'pty',
    'urllib',
    'http',
    'sys',
    'importlib',
    'builtins',
    'pathlib',
    'io',
    'tempfile',
    'platform',
    'getpass',
    'inspect',
    'code',
    'codeop',
    'multiprocessing',
    'threading',
    'concurrent',
    'pickle',
    'marshal',
    'shelve',
    'requests',
    'httpx',
    'aiohttp',
    'webbrowser',
    'ftplib',
    'smtplib',
    'poplib',
    'imaplib',
    'sqlite3',
    'signal',
    'resource',
    'gc',
    'fcntl',
    'termios',
    'tty',
    'mmap',
    'selectors',
    'asyncio',
    'pkgutil',
    'runpy',
    'venv',
    'ensurepip',
    'pip',
    'zipimport',
}

FORBIDDEN_CALLS = {
    'open',
    'eval',
    'exec',
    'compile',
    '__import__',
    'getattr',
    'setattr',
    'delattr',
    'globals',
    'locals',
    'vars',
    'dir',
    'breakpoint',
    'input',
    'memoryview',
}

FORBIDDEN_ATTRS = {
    '__import__',
    '__builtins__',
    '__subclasses__',
    '__globals__',
    '__class__',
    '__bases__',
    '__base__',
    '__mro__',
    '__dict__',
    '__code__',
    '__closure__',
    '__func__',
    '__self__',
    '__loader__',
    '__spec__',
    '__reduce__',
    '__reduce_ex__',
    '__getattribute__',
    'gi_frame',
    'gi_code',
    'cr_frame',
    'ag_frame',
    'f_globals',
    'f_locals',
    'f_builtins',
    'f_back',
}

ALLOWED_IMAGE_SIGNATURES = {
    '.pdf': (b'%PDF-',),
    '.png': (b'\x89PNG\r\n\x1a\n',),
    '.jpg': (b'\xff\xd8\xff',),
    '.jpeg': (b'\xff\xd8\xff',),
}


def safe_int(
    raw: object,
    default: Optional[int] = None,
    min_val: Optional[int] = None,
    max_val: Optional[int] = None,
) -> Tuple[Optional[int], Optional[str]]:
    """Safely parse an integer within optional bounds without raising."""
    if raw is None or (isinstance(raw, str) and not raw.strip()):
        if default is not None:
            return default, None
        return None, 'A valid integer value is required.'
    try:
        val = int(str(raw).strip())
    except (ValueError, TypeError):
        return None, f'Invalid integer value: {str(raw)[:40]}'
    if min_val is not None and val < min_val:
        return None, f'Value must be at least {min_val}.'
    if max_val is not None and val > max_val:
        return None, f'Value must be at most {max_val}.'
    return val, None


def safe_date(
    raw: object,
    allow_none: bool = False,
) -> Tuple[Optional[datetime.date], Optional[str]]:
    """Safely parse an ISO YYYY-MM-DD date string."""
    text = str(raw or '').strip()
    if not text:
        if allow_none:
            return None, None
        return None, 'A valid date (YYYY-MM-DD) is required.'
    try:
        return datetime.date.fromisoformat(text), None
    except ValueError:
        return None, f'Invalid date format: {text[:32]}. Expected YYYY-MM-DD.'


def validate_uploaded_file(
    uploaded_file,
    allowed_exts: Iterable[str] = ('.pdf', '.png', '.jpg', '.jpeg'),
    max_bytes: int = 10 * 1024 * 1024,
) -> Tuple[Optional[str], Optional[str]]:
    """Validate uploaded file extension, size, magic bytes, and return sanitized filename."""
    if uploaded_file is None:
        return None, 'No file provided.'

    raw_name = os.path.basename(str(getattr(uploaded_file, 'name', '') or '')).strip()
    if not raw_name:
        return None, 'Uploaded file is missing a filename.'

    _, ext = os.path.splitext(raw_name.lower())
    allowed_set = {e.lower() for e in allowed_exts}
    if ext not in allowed_set:
        return None, f'Unsupported file type "{ext}". Allowed: {", ".join(sorted(allowed_set))}.'

    size = getattr(uploaded_file, 'size', None)
    if size is not None and (size <= 0 or size > max_bytes):
        mb = max_bytes // (1024 * 1024)
        return None, f'File size must be between 1 byte and {mb} MB.'

    try:
        pos = uploaded_file.tell() if hasattr(uploaded_file, 'tell') else None
        header = uploaded_file.read(16)
        if hasattr(uploaded_file, 'seek'):
            uploaded_file.seek(pos if pos is not None else 0)
    except Exception:
        return None, 'Unable to read uploaded file header.'

    if not header:
        return None, 'Uploaded file appears to be empty.'

    expected_sigs = ALLOWED_IMAGE_SIGNATURES.get(ext)
    if expected_sigs and not any(header.startswith(sig) for sig in expected_sigs):
        return None, f'File signature does not match {ext} format.'

    stem = re.sub(r'[^A-Za-z0-9_-]+', '_', os.path.splitext(raw_name)[0]).strip('_')[:48] or 'upload'
    safe_name = f'{uuid.uuid4().hex[:12]}_{stem}{ext}'
    return safe_name, None


def validate_safe_python_code(code: str, max_chars: int = 16000) -> Optional[str]:
    """Perform AST and lexical validation on user-submitted Python code.

    Returns None if the code passes static safety checks, or an error string describing
    the blocked construct.
    """
    if not isinstance(code, str) or not code.strip():
        return 'Python code cannot be empty.'
    if len(code) > max_chars:
        return f'Python code exceeds maximum allowed length ({max_chars} characters).'

    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        return f'SyntaxError on line {exc.lineno}: {exc.msg}'

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_mod = alias.name.split('.')[0].strip()
                if root_mod in FORBIDDEN_MODULES:
                    return f'Restricted operation: importing "{root_mod}" is prohibited in the Coding Lab sandbox.'
        elif isinstance(node, ast.ImportFrom):
            root_mod = (node.module or '').split('.')[0].strip()
            if not root_mod or root_mod in FORBIDDEN_MODULES:
                return f'Restricted operation: importing from "{root_mod or "relative"}" is prohibited in the Coding Lab sandbox.'
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_CALLS:
                return f'Restricted operation: calling "{node.func.id}()" is prohibited in the Coding Lab sandbox.'
            if isinstance(node.func, ast.Attribute) and node.func.attr in FORBIDDEN_CALLS:
                return f'Restricted operation: calling ".{node.func.attr}()" is prohibited in the Coding Lab sandbox.'
        elif isinstance(node, ast.Attribute):
            if node.attr in FORBIDDEN_ATTRS or (node.attr.startswith('__') and node.attr.endswith('__') and node.attr not in {'__init__', '__str__', '__repr__', '__len__', '__iter__', '__next__', '__eq__', '__lt__', '__le__', '__gt__', '__ge__', '__hash__', '__name__', '__main__'}):
                return f'Restricted operation: accessing attribute "{node.attr}" is prohibited in the Coding Lab sandbox.'
        elif isinstance(node, ast.Name):
            if node.id in FORBIDDEN_ATTRS or node.id in {'__builtins__'}:
                return f'Restricted operation: referencing "{node.id}" is prohibited in the Coding Lab sandbox.'

    return None


def _build_runner_wrapper(user_code: str) -> str:
    """Wrap user code in an isolated runner setting OS resource limits without leaking into user namespace."""
    encoded = repr(user_code)
    return (
        "import sys\n"
        "try:\n"
        "    import resource\n"
        "    resource.setrlimit(resource.RLIMIT_CPU, (2, 2))\n"
        "    resource.setrlimit(resource.RLIMIT_FSIZE, (0, 0))\n"
        "    try:\n"
        "        resource.setrlimit(resource.RLIMIT_NPROC, (0, 0))\n"
        "    except Exception:\n"
        "        pass\n"
        "except Exception:\n"
        "    pass\n"
        "__user_ns = {'__name__': '__main__'}\n"
        f"exec(compile({encoded}, '<coding_lab>', 'exec'), __user_ns, __user_ns)\n"
    )


def execute_python_isolated(
    code: str,
    expected_stdout: str = '',
    timeout_seconds: float = 3.0,
    max_output_bytes: int = 32768,
) -> dict:
    """Validate and execute Python code inside an isolated temporary directory with scrubbed env."""
    clean_code = (code or '').strip()
    if not clean_code:
        return {
            'status': 'error',
            'stdout': '',
            'stderr': 'Empty Python source submitted.',
            'passed': False,
        }

    safety_error = validate_safe_python_code(clean_code)
    if safety_error:
        return {
            'status': 'blocked',
            'stdout': '',
            'stderr': safety_error,
            'passed': False,
        }

    runner_script = _build_runner_wrapper(clean_code)
    safe_env = {
        'PYTHONNOUSERSITE': '1',
        'PYTHONDONTWRITEBYTECODE': '1',
        'LC_ALL': 'C.UTF-8',
        'LANG': 'C.UTF-8',
    }
    import time
    started = time.monotonic()

    with tempfile.TemporaryDirectory(prefix='mca_sandbox_') as tmpdir:
        try:
            proc = subprocess.run(
                [sys.executable, '-I', '-c', runner_script],
                cwd=tmpdir,
                env=safe_env,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
            )
            elapsed_ms = int((time.monotonic() - started) * 1000)
            stdout = (proc.stdout or '')[:max_output_bytes].strip()
            stderr = (proc.stderr or '')[:max_output_bytes].strip()
            expected = (expected_stdout or '').strip()
            passed = proc.returncode == 0 and (not expected or stdout == expected)
            return {
                'status': 'ok' if proc.returncode == 0 else 'runtime_error',
                'stdout': stdout,
                'stderr': stderr,
                'returncode': proc.returncode,
                'elapsed_ms': elapsed_ms,
                'passed': passed,
            }
        except subprocess.TimeoutExpired:
            return {
                'status': 'timeout',
                'stdout': '',
                'stderr': f'Execution timed out after {int(timeout_seconds)} seconds.',
                'returncode': -1,
                'elapsed_ms': int((time.monotonic() - started) * 1000),
                'passed': False,
            }
        except Exception:
            return {
                'status': 'error',
                'stdout': '',
                'stderr': 'Sandbox execution failed unexpectedly.',
                'returncode': -1,
                'elapsed_ms': int((time.monotonic() - started) * 1000),
                'passed': False,
            }


def is_safe_url_for_host(target_url: str, request) -> bool:
    """Validate that a redirect target belongs cleanly to the current request host."""
    if not target_url:
        return False
    try:
        from django.utils.http import url_has_allowed_host_and_scheme

        return url_has_allowed_host_and_scheme(
            url=target_url,
            allowed_hosts={request.get_host()},
            require_https=request.is_secure(),
        )
    except Exception:
        return target_url.startswith('/') and not target_url.startswith('//')


def _derive_cookie_subkeys(secret: str) -> Tuple[bytes, bytes]:
    """Derive independent encryption and authentication subkeys from COOKIE_ENCRYPTION_SECRET."""
    import hashlib
    import hmac

    raw_secret = (secret or '').encode('utf-8')
    if len(raw_secret) < 16:
        raise ValueError('COOKIE_ENCRYPTION_SECRET must be at least 16 bytes.')
    enc_key = hmac.new(raw_secret, b'mca-cookie-enc-v1', hashlib.sha256).digest()
    mac_key = hmac.new(raw_secret, b'mca-cookie-mac-v1', hashlib.sha256).digest()
    return enc_key, mac_key


def _ctr_xor_stream(data: bytes, enc_key: bytes, nonce: bytes) -> bytes:
    """Generate deterministic HMAC-SHA256 CTR keystream XORed with data."""
    import hashlib
    import hmac

    out = bytearray(len(data))
    block_idx = 0
    offset = 0
    while offset < len(data):
        counter_bytes = block_idx.to_bytes(4, 'big')
        keystream = hmac.new(enc_key, nonce + counter_bytes, hashlib.sha256).digest()
        chunk_len = min(len(keystream), len(data) - offset)
        for i in range(chunk_len):
            out[offset + i] = data[offset + i] ^ keystream[i]
        offset += chunk_len
        block_idx += 1
    return bytes(out)


def encrypt_cookie_value(
    plaintext: str,
    secret: str,
    max_age_seconds: int = 30 * 86400,
) -> str:
    """Encrypt and authenticate a cookie string using COOKIE_ENCRYPTION_SECRET (Encrypt-then-MAC)."""
    import base64
    import hashlib
    import hmac
    import json
    import secrets as _secrets
    import time

    enc_key, mac_key = _derive_cookie_subkeys(secret)
    nonce = _secrets.token_bytes(16)
    payload = json.dumps(
        {
            'v': 1,
            'u': str(plaintext),
            'exp': int(time.time()) + max(60, int(max_age_seconds)),
        },
        separators=(',', ':'),
    ).encode('utf-8')
    ciphertext = _ctr_xor_stream(payload, enc_key, nonce)
    tag = hmac.new(mac_key, b'v1|' + nonce + ciphertext, hashlib.sha256).digest()
    encoded = base64.urlsafe_b64encode(nonce + ciphertext + tag).decode('ascii').rstrip('=')
    return f'v1.{encoded}'


def decrypt_cookie_value(
    token: Optional[str],
    secret: str,
) -> Optional[str]:
    """Verify MAC, decrypt, and check expiration of an encrypted Remember-Me cookie."""
    import base64
    import hashlib
    import hmac
    import json
    import time

    if not token or not isinstance(token, str) or not token.startswith('v1.'):
        return None
    try:
        enc_key, mac_key = _derive_cookie_subkeys(secret)
        b64_part = token[3:]
        padding = '=' * (-len(b64_part) % 4)
        raw = base64.urlsafe_b64decode(b64_part + padding)
        if len(raw) <= 48:
            return None
        nonce = raw[:16]
        tag = raw[-32:]
        ciphertext = raw[16:-32]
        expected_tag = hmac.new(mac_key, b'v1|' + nonce + ciphertext, hashlib.sha256).digest()
        if not hmac.compare_digest(tag, expected_tag):
            return None
        plaintext_bytes = _ctr_xor_stream(ciphertext, enc_key, nonce)
        data = json.loads(plaintext_bytes.decode('utf-8'))
        if not isinstance(data, dict) or data.get('v') != 1:
            return None
        exp = int(data.get('exp', 0))
        if exp <= int(time.time()):
            return None
        val = data.get('u')
        return str(val) if isinstance(val, str) and val.strip() else None
    except Exception:
        return None

