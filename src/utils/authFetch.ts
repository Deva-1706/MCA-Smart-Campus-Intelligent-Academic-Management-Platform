const CSRF_COOKIE_NAME = 'mca_csrf_token';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

let inMemoryCsrfToken: string | null = null;
let csrfInflightPromise: Promise<string | null> | null = null;

export function getCsrfCookieToken(): string | null {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    if (key === CSRF_COOKIE_NAME) {
      const value = trimmed.slice(eqIndex + 1).trim();
      if (value) {
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
  }
  return null;
}

export async function ensureCsrfToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh) {
    const cookieTok = getCsrfCookieToken();
    if (cookieTok) {
      inMemoryCsrfToken = cookieTok;
      return cookieTok;
    }
    if (inMemoryCsrfToken) {
      return inMemoryCsrfToken;
    }
  }

  if (csrfInflightPromise && !forceRefresh) {
    return csrfInflightPromise;
  }

  csrfInflightPromise = (async () => {
    try {
      const res = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'same-origin',
      });
      if (!res.ok) return getCsrfCookieToken();
      const data = await res.json().catch(() => null);
      const token =
        (data && typeof data.csrfToken === 'string' && data.csrfToken.trim()) ||
        getCsrfCookieToken() ||
        null;
      if (token) {
        inMemoryCsrfToken = token;
      }
      return token;
    } catch {
      return getCsrfCookieToken();
    } finally {
      csrfInflightPromise = null;
    }
  })();

  return csrfInflightPromise;
}

export function clearCachedCsrfToken(): void {
  inMemoryCsrfToken = null;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || undefined);

  if (MUTATING_METHODS.has(method) && !headers.has('X-CSRF-Token')) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  const response = await fetch(input, {
    ...init,
    credentials: init.credentials ?? 'same-origin',
    headers,
  });

  // Refresh local CSRF token cache if cookie updated by response
  const updatedCookieTok = getCsrfCookieToken();
  if (updatedCookieTok) {
    inMemoryCsrfToken = updatedCookieTok;
  }

  // If server rejected due to rotated/missing CSRF cookie, refresh CSRF token once and retry
  if (response.status === 403 && MUTATING_METHODS.has(method)) {
    const clone = response.clone();
    const errBody = await clone.json().catch(() => null);
    if (errBody?.code === 'CSRF_INVALID') {
      const refreshedToken = await ensureCsrfToken(true);
      if (refreshedToken) {
        headers.set('X-CSRF-Token', refreshedToken);
        return fetch(input, {
          ...init,
          credentials: init.credentials ?? 'same-origin',
          headers,
        });
      }
    }
  }

  return response;
}
