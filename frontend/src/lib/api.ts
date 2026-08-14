const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ─── Token store ──────────────────────────────────────────────────────────────
// El access token vive aquí (módulo-level) para que api.ts no dependa de React.
// AuthContext llama setApiToken() cuando obtiene / renueva el token.

let _accessToken: string | null = null;
let _onAuthError: (() => void) | null = null;

export function setApiToken(token: string | null): void {
  _accessToken = token;
}

export function getApiToken(): string | null {
  return _accessToken;
}

export function setOnAuthError(cb: () => void): void {
  _onAuthError = cb;
}

// ─── Refresh mutex ────────────────────────────────────────────────────────────
// Evita que múltiples requests en vuelo lancen el refresh simultáneamente.

let _isRefreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

function subscribeToRefresh(cb: (token: string | null) => void) {
  _refreshQueue.push(cb);
}

function notifyRefreshSubscribers(token: string | null) {
  _refreshQueue.forEach((cb) => cb(token));
  _refreshQueue = [];
}

async function refreshTokens(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken: string };
    return data.accessToken;
  } catch {
    return null;
  }
}

// ─── Core request ─────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (res.status !== 401) {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = new Error((body as { message?: string }).message ?? `HTTP ${res.status}`) as Error & { status: number };
      err.status = res.status;
      throw err;
    }
    // 204 o cuerpo vacío (ej. DELETE sin contenido) — res.json() lanzaría
    // SyntaxError si se intenta parsear un body vacío.
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as T;
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  // ── 401: intentar refresh ─────────────────────────────────────────────────

  if (_isRefreshing) {
    // Otro request ya está haciendo refresh — encolar y esperar
    return new Promise<T>((resolve, reject) => {
      subscribeToRefresh(async (newToken) => {
        if (!newToken) {
          reject(new Error('Session expired'));
          return;
        }
        try {
          resolve(await request<T>(path, init));
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  _isRefreshing = true;
  const newToken = await refreshTokens();
  _isRefreshing = false;

  if (!newToken) {
    notifyRefreshSubscribers(null);
    _onAuthError?.();
    throw new Error('Session expired');
  }

  setApiToken(newToken);
  notifyRefreshSubscribers(newToken);

  // Reintentar el request original con el nuevo token
  return request<T>(path, init);
}

// ─── API pública ──────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
