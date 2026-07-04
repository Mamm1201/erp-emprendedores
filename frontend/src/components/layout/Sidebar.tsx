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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { to: '/cuentas-cobro', label: 'Cuentas de cobro', icon: Receipt },
  { to: '/pagos', label: 'Pagos recibidos', icon: Banknote },
  { to: '/estado-cuentas', label: 'Estado de cuentas', icon: BarChart3 },
  { to: '/ordenes', label: 'Órdenes de trabajo', icon: ClipboardList },
  { to: '/actas', label: 'Actas técnicas', icon: ClipboardCheck },
  { to: '/planes', label: 'Planes de mantenimiento', icon: CalendarClock },
  { to: '/equipos', label: 'Equipos', icon: Wrench },
];

// ─── NodeMark ─────────────────────────────────────────────────────────────────
// Marca de nodo STECH NODES — elemento iconográfico del sistema visual.
// Reutilizable en cualquier producto de la familia (Readiness, Pathways, etc.)

function NodeMark({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Connection lines — drawn first so nodes render on top */}
      <line x1="14" y1="14" x2="5"  y2="7"  stroke="currentColor" strokeWidth="1"   strokeOpacity="0.35" />
      <line x1="14" y1="14" x2="23" y2="7"  stroke="currentColor" strokeWidth="1"   strokeOpacity="0.35" />
      <line x1="14" y1="14" x2="5"  y2="21" stroke="currentColor" strokeWidth="1"   strokeOpacity="0.35" />
      <line x1="14" y1="14" x2="23" y2="21" stroke="currentColor" strokeWidth="1"   strokeOpacity="0.35" />

      {/* Peripheral nodes */}
      <circle cx="5"  cy="7"  r="2.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="23" cy="7"  r="2.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="5"  cy="21" r="2.5" fill="currentColor" fillOpacity="0.25" />
      <circle cx="23" cy="21" r="2.5" fill="currentColor" fillOpacity="0.25" />

      {/* Central node — hub */}
      <circle cx="14" cy="14" r="5"   fill="currentColor" fillOpacity="0.15" />
      <circle cx="14" cy="14" r="3"   fill="currentColor" />
    </svg>
  );
}

// ─── BrandHeader ──────────────────────────────────────────────────────────────
// Cabecera de marca reutilizable para todos los productos de la familia STECH NODES.
// productName: "Ops" | "Readiness" | "Pathways" | etc.

interface BrandHeaderProps {
  productName: string;
}

function BrandHeader({ productName }: BrandHeaderProps) {
  return (
    <div className="px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
      <div className="flex items-center gap-3">
        <NodeMark className="text-[hsl(var(--sidebar-accent-foreground))] shrink-0" />
        <div className="min-w-0">
          {/* Marca principal — Inter ExtraBold, tracking amplio, máximo protagonismo */}
          <p className="text-sm font-extrabold tracking-widest uppercase text-[hsl(var(--sidebar-foreground))] leading-none">
            STECH NODES
          </p>
          {/* Nombre del producto — Node Teal, jerarquía secundaria */}
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
      </nav>

      {/* Footer — usuario activo */}
      <div className="px-5 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2">
          {/* Indicador de sesión activa */}
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-accent-foreground))] shrink-0" />
          <p className="text-xs text-[hsl(var(--sidebar-foreground)/0.45)] truncate">
            Mario A. Márquez
          </p>
        </div>
      </div>

    </aside>
  );
}
