import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { AuthUser } from '@/lib/types';
import { setApiToken, getApiToken, setOnAuthError } from '@/lib/api';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(accessToken: string): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json() as Promise<AuthUser>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setApiToken(null);
    setUser(null);
  }, []);

  // Registra callback en api.ts: cuando refresh falla en un request protegido,
  // limpia la sesión → ProtectedRoute redirige a /login automáticamente.
  useEffect(() => {
    setOnAuthError(clearSession);
  }, [clearSession]);

  // ── Inicialización: intenta renovar la sesión al montar ───────────────────
  useEffect(() => {
    async function initialize() {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          clearSession();
          return;
        }

        const { accessToken } = (await res.json()) as { accessToken: string };
        setApiToken(accessToken);
        setUser(await fetchMe(accessToken));
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message ?? 'Credenciales inválidas');
    }

    const { accessToken } = (await res.json()) as { accessToken: string };
    setApiToken(accessToken);
    setUser(await fetchMe(accessToken));
  }, []);

  const logout = useCallback(async () => {
    try {
      // Llama al endpoint con el token actual (ya registrado en api.ts module var)
      // Usamos fetch directo para evitar loop si el token ya expiró
      const token = getApiToken();
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // silencioso — la sesión se limpia de todas formas
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
