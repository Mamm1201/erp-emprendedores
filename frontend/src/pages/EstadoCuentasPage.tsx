import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

import { useFinancialSummary } from '@/hooks/use-invoices';
import type { InvoiceStatus } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';

// ─── SummaryCard ──────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: 'blue' | 'red' | 'green' | 'gray';
  onClick?: () => void;
}) {
  const colorMap = {
    blue:  'bg-stech-blue/10 text-stech-blue border-stech-blue/30',
    red:   'bg-alert-red/10 text-alert-red border-alert-red/30',
    green: 'bg-node-teal/10 text-node-teal border-node-teal/30',
    gray: 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]',
  };

  return (
    <div
      className={`rounded-lg border p-4 space-y-2 ${onClick ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
        <span className={`p-1.5 rounded-md ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-[hsl(var(--muted-foreground))]">{sub}</p>}
    </div>
  );
}

// ─── Status row ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Borrador',
  ISSUED: 'Emitidas',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagadas',
  VOID: 'Anuladas',
};

const STATUS_ORDER: InvoiceStatus[] = [
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'DRAFT',
  'VOID',
];

// ─── Month name helper ────────────────────────────────────────────────────────

function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(d, 'MMM yyyy', { locale: es });
}

// ─── EstadoCuentasPage ────────────────────────────────────────────────────────

export function EstadoCuentasPage() {
  const navigate = useNavigate();
  const { data: summary, isLoading, isError, refetch } = useFinancialSummary();

  if (isLoading) {
    return (
      <div className="p-6 text-[hsl(var(--muted-foreground))]">Cargando resumen financiero…</div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-[hsl(var(--destructive))]">No se pudo cargar el resumen financiero.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  const s = summary;
  const hasOverdue = s.overdue.count > 0;

  // Variation vs last month
  const thisM = parseFloat(s.paidThisMonth);
  const lastM = parseFloat(s.paidLastMonth);
  const variation =
    lastM > 0 ? Math.round(((thisM - lastM) / lastM) * 100) : null;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estado de cuentas</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Resumen financiero del negocio
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
          Actualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Por cobrar"
          value={formatMoney(s.totalReceivable)}
          sub={`${(s.byStatus['ISSUED']?.count ?? 0) + (s.byStatus['PARTIALLY_PAID']?.count ?? 0)} cuenta(s) pendiente(s)`}
          icon={Clock}
          color="blue"
          onClick={() => navigate('/cuentas-cobro')}
        />
        <SummaryCard
          label="Vencidas"
          value={formatMoney(s.overdue.total)}
          sub={s.overdue.count > 0 ? `${s.overdue.count} cuenta(s) vencida(s)` : 'Sin vencidos'}
          icon={AlertTriangle}
          color={hasOverdue ? 'red' : 'gray'}
          onClick={hasOverdue ? () => navigate('/cuentas-cobro') : undefined}
        />
        <SummaryCard
          label="Cobrado este mes"
          value={formatMoney(s.paidThisMonth)}
          sub={
            variation !== null
              ? variation >= 0
                ? `↑ ${variation}% vs mes anterior`
                : `↓ ${Math.abs(variation)}% vs mes anterior`
              : 'Primer mes registrado'
          }
          icon={TrendingUp}
          color="green"
        />
        <SummaryCard
          label="Cobrado mes anterior"
          value={formatMoney(s.paidLastMonth)}
          sub="Pagos recibidos"
          icon={CheckCircle}
          color="gray"
        />
      </div>

      {/* Body: two columns on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Facturas por estado */}
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-semibold">Cuentas de cobro por estado</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
                <th className="pb-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))]">Qty</th>
                <th className="pb-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))]">Total emitido</th>
              </tr>
            </thead>
            <tbody>
              {STATUS_ORDER.map((status) => {
                const g = s.byStatus[status];
                if (!g) return null;
                return (
                  <tr key={status} className="border-b last:border-0">
                    <td className="py-2 text-[hsl(var(--muted-foreground))]">
                      {STATUS_LABELS[status]}
                    </td>
                    <td className="py-2 text-right tabular-nums">{g.count}</td>
                    <td className="py-2 text-right tabular-nums font-medium">
                      {formatMoney(g.total)}
                    </td>
                  </tr>
                );
              })}
              {Object.keys(s.byStatus).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-[hsl(var(--muted-foreground))]">
                    Sin cuentas de cobro
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/cuentas-cobro')}
            >
              Ver todas las cuentas →
            </Button>
          </div>
        </div>

        {/* Ingresos por mes */}
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-semibold">Ingresos cobrados — últimos 12 meses</h2>
          {s.revenueByMonth.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">
              Sin pagos registrados en los últimos 12 meses
            </p>
          ) : (
            <div className="space-y-1">
              {[...s.revenueByMonth].reverse().map(({ yearMonth, amount }) => {
                const maxAmount = Math.max(
                  ...s.revenueByMonth.map((r) => parseFloat(r.amount)),
                );
                const pct =
                  maxAmount > 0
                    ? Math.round((parseFloat(amount) / maxAmount) * 100)
                    : 0;

                return (
                  <div key={yearMonth} className="flex items-center gap-3">
                    <span className="text-xs text-[hsl(var(--muted-foreground))] w-16 text-right shrink-0">
                      {monthLabel(yearMonth)}
                    </span>
                    <div className="flex-1 bg-[hsl(var(--muted)/0.5)] rounded-full h-2">
                      <div
                        className="bg-[hsl(var(--primary))] h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums w-24 text-right shrink-0">
                      {formatMoney(amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/pagos')}
            >
              Ver todos los pagos →
            </Button>
          </div>
        </div>
      </div>

      {/* Overdue alert */}
      {hasOverdue && (
        <div className="rounded-lg border border-alert-red/20 bg-alert-red/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-alert-red mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-alert-red">
              {s.overdue.count} cuenta{s.overdue.count !== 1 ? 's' : ''} de cobro vencida
              {s.overdue.count !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-alert-red mt-0.5">
              Total pendiente vencido: <span className="font-semibold">{formatMoney(s.overdue.total)}</span>
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-alert-red border-alert-red/30 hover:bg-alert-red/10 shrink-0"
            onClick={() => navigate('/cuentas-cobro')}
          >
            Ver facturas
          </Button>
        </div>
      )}
    </div>
  );
}
