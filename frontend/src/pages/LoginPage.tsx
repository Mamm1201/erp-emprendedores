import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NodeMark } from '@/components/layout/NodeMark';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="w-full max-w-sm">

        {/* Marca */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <NodeMark className="text-[hsl(var(--node-teal))] h-10 w-10" />
          <div className="text-center">
            <p className="text-sm font-extrabold tracking-widest uppercase text-[hsl(var(--foreground))]">
              STECH NODES
            </p>
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-[hsl(var(--node-teal))] mt-0.5">
              Ops
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-8 space-y-5 shadow-sm"
        >
          <h1 className="text-base font-semibold text-[hsl(var(--foreground))]">
            Iniciar sesión
          </h1>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--node-teal))] focus:ring-offset-1"
              placeholder="nombre@empresa.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--node-teal))] focus:ring-offset-1"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-[hsl(var(--alert-red))]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[hsl(var(--node-teal))] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(var(--node-teal)/0.85)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

      </div>
    </div>
  );
}
