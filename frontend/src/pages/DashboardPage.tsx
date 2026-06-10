import { useNavigate } from 'react-router-dom';
import { differenceInDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarClock,
  ClipboardList,
  FileText,
  Receipt,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

import { useDashboard } from '@/hooks/use-dashboard';
import type { MaintenanceFrequency, PaymentMethod } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQ_LABELS: Record<MaintenanceFrequency, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  EVERY_4_MONTHS: 'Cuatrimestral',
  BIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
};

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  onClick?: () => void;
}) {
  const accentClasses: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  const iconClass = accent ? accentClasses[accent] : 'text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted)/0.5)]';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'rounded-lg border p-4 space-y-3',
        onClick && 'cursor-pointer hover:shadow-sm hover:border-[hsl(var(--primary)/0.4)] transition-all',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
          {label}
        </p>
        <span className={cn('p-1.5 rounded-md', iconClass)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      {sub && (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{sub}</p>
      )}
    </div>
  );
}

// ─── PipelineStep ─────────────────────────────────────────────────────────────

function PipelineStep({
  label,
  count,
  color,
  alert,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  alert?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 px-4 py-3 rounded-lg border transition-colors text-center min-w-[100px]',
        alert && count > 0
          ? 'bg-amber-50 border-amber-200 text-amber-800'
          : 'hover:bg-[hsl(var(--muted)/0.5)]',
      )}
    >
      <span
        className={cn(
          'text-2xl font-bold tabular-nums',
          alert && count > 0 ? 'text-amber-700' : color,
        )}
      >
        {count}
      </span>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </button>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();
  const today = new Date();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Cargando dashboard…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-[hsl(var(--destructive))]">Error al cargar el dashboard.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const { quotations, workOrders, invoices, recentPayments, upcomingVisits } = data;
  const hasOverdue = invoices.overdue.count > 0;
  const pendingAction =
    quotations.approved + workOrders.inProgress + workOrders.completedWithoutInvoice;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            {format(today, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          className={isFetching ? 'animate-spin' : ''}
          title="Actualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Overdue alert */}
      {hasOverdue && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/cuentas-cobro')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/cuentas-cobro')}
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 cursor-pointer hover:bg-red-100 transition-colors"
        >
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-800 flex-1">
            <span className="font-semibold">
              {invoices.overdue.count} cuenta{invoices.overdue.count !== 1 ? 's' : ''} de cobro vencida{invoices.overdue.count !== 1 ? 's' : ''}
            </span>
            {' — '}total vencido: <span className="font-semibold">{formatMoney(invoices.overdue.total)}</span>
          </p>
          <ArrowRight className="h-4 w-4 text-red-500 shrink-0" />
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="OTs activas"
          value={workOrders.scheduled + workOrders.inProgress}
          sub={`${workOrders.inProgress} en progreso · ${workOrders.scheduled} programadas`}
          icon={ClipboardList}
          accent="blue"
          onClick={() => navigate('/ordenes')}
        />
        <KpiCard
          label="Cotizaciones"
          value={quotations.approved + quotations.sent + quotations.draft}
          sub={`${quotations.approved} aprobadas · ${quotations.sent} enviadas`}
          icon={FileText}
          accent="purple"
          onClick={() => navigate('/cotizaciones')}
        />
        <KpiCard
          label="Por cobrar"
          value={formatMoney(invoices.totalReceivable)}
          sub={`${invoices.issued + invoices.partiallyPaid} cuenta(s) pendiente(s)`}
          icon={Receipt}
          accent={hasOverdue ? 'red' : 'amber'}
          onClick={() => navigate('/cuentas-cobro')}
        />
        <KpiCard
          label="Cobrado este mes"
          value={formatMoney(invoices.paidThisMonth)}
          sub="Pagos recibidos en el mes"
          icon={TrendingUp}
          accent="green"
          onClick={() => navigate('/pagos')}
        />
        <KpiCard
          label="Vencidas"
          value={invoices.overdue.count}
          sub={invoices.overdue.count > 0 ? formatMoney(invoices.overdue.total) : 'Sin cuentas vencidas'}
          icon={AlertTriangle}
          accent={invoices.overdue.count > 0 ? 'red' : undefined}
          onClick={() => navigate('/cuentas-cobro')}
        />
      </div>

      {/* Pipeline */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Flujo del negocio</h2>
          {pendingAction > 0 && (
            <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {pendingAction} acción{pendingAction !== 1 ? 'es' : ''} pendiente{pendingAction !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PipelineStep
            label="Cotizaciones aprobadas"
            count={quotations.approved}
            color="text-purple-700"
            alert
            onClick={() => navigate('/cotizaciones')}
          />
          <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
          <PipelineStep
            label="OTs en progreso"
            count={workOrders.inProgress}
            color="text-blue-700"
            onClick={() => navigate('/ordenes')}
          />
          <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
          <PipelineStep
            label="OTs sin facturar"
            count={workOrders.completedWithoutInvoice}
            color="text-amber-700"
            alert
            onClick={() => navigate('/cuentas-cobro/nueva')}
          />
          <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
          <PipelineStep
            label="CC emitidas"
            count={invoices.issued + invoices.partiallyPaid}
            color="text-green-700"
            onClick={() => navigate('/cuentas-cobro')}
          />
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming visits */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Próximas visitas (30 días)
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => navigate('/planes')}
            >
              Ver planes →
            </Button>
          </div>

          {upcomingVisits.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">
              Sin visitas programadas en los próximos 30 días
            </p>
          ) : (
            <div className="space-y-0 divide-y">
              {upcomingVisits.map((v) => {
                const daysLeft = differenceInDays(parseISO(v.nextVisitDate), today);
                return (
                  <div key={v.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {v.client.tradeName ?? v.client.legalName}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {v.branch?.name ?? '—'}
                        {v.branch?.city ? ` · ${v.branch.city}` : ''}
                        {' · '}
                        <span>{FREQ_LABELS[v.frequency]}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {daysLeft < 0 ? (
                        <Badge variant="danger">Vencida</Badge>
                      ) : daysLeft <= 7 ? (
                        <Badge variant="danger">Esta semana</Badge>
                      ) : daysLeft <= 14 ? (
                        <Badge variant="warning">Prox. semana</Badge>
                      ) : (
                        <Badge variant="secondary">En {daysLeft}d</Badge>
                      )}
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {format(parseISO(v.nextVisitDate), 'd MMM', { locale: es })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Banknote className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Últimos pagos recibidos
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => navigate('/pagos')}
            >
              Ver todos →
            </Button>
          </div>

          {recentPayments.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">
              Sin pagos registrados
            </p>
          ) : (
            <div className="space-y-0 divide-y">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/cuentas-cobro/${p.invoice.id}`)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && navigate(`/cuentas-cobro/${p.invoice.id}`)
                  }
                  className="py-2.5 flex items-start justify-between gap-2 cursor-pointer hover:bg-[hsl(var(--muted)/0.3)] -mx-2 px-2 rounded transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.invoice.client.tradeName ?? p.invoice.client.legalName}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      <span className="font-mono">{p.invoice.number}</span>
                      {' · '}
                      {METHOD_LABELS[p.method]}
                      {p.reference ? ` · ${p.reference}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-green-700 tabular-nums">
                      {formatMoney(p.amount)}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {format(parseISO(p.paidAt), 'd MMM', { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
