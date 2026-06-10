import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  ClipboardCheck,
  Wrench,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { to: '/ordenes', label: 'Órdenes de trabajo', icon: ClipboardList },
  { to: '/actas', label: 'Actas técnicas', icon: ClipboardCheck },
  { to: '/planes', label: 'Planes de mantenimiento', icon: CalendarClock },
  { to: '/equipos', label: 'Equipos', icon: Wrench },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 flex flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-screen">
      <div className="px-6 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/0.5)]">
          ERP Mantenimiento
        </p>
        <p className="text-sm font-medium mt-0.5 text-[hsl(var(--sidebar-foreground))]">
          Sistemas Hospitalarios
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]'
                  : 'text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <p className="text-xs text-[hsl(var(--sidebar-foreground)/0.4)]">
          Mario A. Márquez
        </p>
      </div>
    </aside>
  );
}
