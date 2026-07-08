import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NodeMark } from '@/components/layout/NodeMark';
import { COMPANY } from '@/config/company';

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
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #020d1a 0%, #042C53 55%, #0a1628 100%)',
      }}
    >
      <div className="w-full max-w-sm px-4">

        {/* Marca */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <NodeMark
            className="h-14 w-14"
            style={{ color: '#378ADD' } as React.CSSProperties}
          />
          <div className="text-center">
            <p
              className="text-base font-extrabold tracking-widest uppercase leading-none"
              style={{ color: '#ffffff', fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
            >
              {COMPANY.name}
            </p>
            <p
              className="text-[10px] font-medium tracking-[0.2em] uppercase mt-1 leading-none"
              style={{ color: '#378ADD' }}
            >
              Ops
            </p>
            <p
              className="text-[10px] mt-3 tracking-wide leading-none"
              style={{ color: 'rgba(55,138,221,0.55)', letterSpacing: '0.06em' }}
            >
              {COMPANY.tagline}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-8 space-y-5 shadow-xl"
          style={{
            background: 'rgba(10, 15, 26, 0.80)',
            border: '1px solid rgba(55,138,221,0.18)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h1
            className="text-sm font-semibold"
            style={{ color: '#e2e8f0' }}
          >
            Iniciar sesión
          </h1>

          <div className="space-y-1">
            <label
              className="text-xs font-medium tracking-wide uppercase"
              htmlFor="email"
              style={{ color: '#64748b', fontSize: '9px', letterSpacing: '0.1em' }}
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
              style={{
                background: '#0a0f1a',
                border: '1px solid #1e3a5f',
                color: '#e2e8f0',
                // @ts-ignore
                '--tw-ring-color': '#185FA5',
              }}
              placeholder="nombre@empresa.com"
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-xs font-medium tracking-wide uppercase"
              htmlFor="password"
              style={{ color: '#64748b', fontSize: '9px', letterSpacing: '0.1em' }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
              style={{
                background: '#0a0f1a',
                border: '1px solid #1e3a5f',
                color: '#e2e8f0',
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: '#C0392B' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isSubmitting ? '#0f4a82' : '#185FA5',
              letterSpacing: '0.04em',
            }}
          >
            {isSubmitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

      </div>
    </div>
  );
}
