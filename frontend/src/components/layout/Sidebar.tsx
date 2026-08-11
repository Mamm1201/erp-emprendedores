import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Banknote,
  BarChart3,
  ClipboardList,
  ClipboardCheck,
  Wrench,
  CalendarClock,
  FileSignature,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { NodeMark } from './NodeMark';
import { COMPANY } from '@/config/company';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { to: '/cuentas-cobro', label: 'Cuentas de cobro', icon: Receipt },
  { to: '/pagos', label: 'Pagos recibidos', icon: Banknote },
  { to: '/estado-cuentas', label: 'Cartera', icon: BarChart3 },
  { to: '/ordenes', label: 'Órdenes de trabajo', icon: ClipboardList },
  { to: '/actas', label: 'Actas técnicas', icon: ClipboardCheck },
  { to: '/contratos', label: 'Contratos mant.', icon: FileSignature },
  { to: '/planes', label: 'Planes de mantenimiento', icon: CalendarClock },
  { to: '/equipos', label: 'Equipos', icon: Wrench },
];

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  COMMERCIAL: 'Comercial',
  TECHNICIAN: 'Técnico',
  BILLING: 'Facturación',
};

// ─── BrandHeader ──────────────────────────────────────────────────────────────

function BrandHeader({ productName }: { productName: string }) {
  return (
    <div className="px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
      <div className="flex items-center gap-3">
        <NodeMark className="h-10 w-10 text-[hsl(var(--sidebar-accent-foreground))] shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-extrabold tracking-widest uppercase text-[hsl(var(--sidebar-foreground))] leading-none">
            {COMPANY.name}
          </p>
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[hsl(var(--sidebar-accent-foreground))] mt-1 leading-none">
            {productName}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen">

      <BrandHeader productName="Ops" />

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] font-medium'
                  : 'text-[hsl(var(--sidebar-foreground)/0.65)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Enlace exclusivo para ADMIN */}
        {isAdmin && (
          <NavLink
            to="/usuarios"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] font-medium'
                  : 'text-[hsl(var(--sidebar-foreground)/0.65)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]',
              )
            }
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Usuarios
          </NavLink>
        )}
      </nav>

      {/* Footer — usuario activo */}
      <div className="px-4 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-accent-foreground))] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[hsl(var(--sidebar-foreground)/0.7)] truncate leading-none">
              {user?.name ?? '—'}
            </p>
            {user?.role && (
              <p className="text-[10px] text-[hsl(var(--sidebar-foreground)/0.35)] mt-0.5 leading-none">
                {ROLE_LABEL[user.role] ?? user.role}
              </p>
            )}
          </div>
          <button
            onClick={() => void logout()}
            title="Cerrar sesión"
            className="shrink-0 p-1 rounded text-[hsl(var(--sidebar-foreground)/0.35)] hover:text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

    </aside>
  );
}
