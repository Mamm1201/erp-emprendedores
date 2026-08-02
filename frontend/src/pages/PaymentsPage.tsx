import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { useAllPayments, useFinancialSummary } from '@/hooks/use-invoices';
import type { PaymentMethod } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Month name helper ────────────────────────────────────────────────────────

function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(d, 'MMM yyyy', { locale: es });
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
};

const METHOD_FILTERS: { value: PaymentMethod | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'OTHER', label: 'Otro' },
];

export function PaymentsPage() {
  const navigate = useNavigate();
  const { data: summary } = useFinancialSummary();
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [includeVoided, setIncludeVoided] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAllPayments({
    method,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    includeVoided,
    page,
  });

  const payments = data?.data ?? [];
  const meta = data?.meta;

  function clearFilters() {
    setMethod('');
    setFromDate('');
    setToDate('');
    setIncludeVoided(false);
    setPage(1);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pagos recibidos</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
          Historial de pagos registrados en todas las cuentas de cobro
        </p>
      </div>

      {/* Ingresos por mes */}
      {summary && (
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-semibold">Ingresos cobrados — últimos 12 meses</h2>
          {summary.revenueByMonth.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">
              Sin pagos registrados en los últimos 12 meses
            </p>
          ) : (
            <div className="space-y-1">
              {[...summary.revenueByMonth].reverse().map(({ yearMonth, amount }) => {
                const maxAmount = Math.max(
                  ...summary.revenueByMonth.map((r) => parseFloat(r.amount)),
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
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-1 flex-wrap">
          {METHOD_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setMethod(value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                method === value
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Desde</p>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="h-8 text-xs w-36"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Hasta</p>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="h-8 text-xs w-36"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none pb-0.5">
            <input
              type="checkbox"
              checked={includeVoided}
              onChange={(e) => { setIncludeVoided(e.target.checked); setPage(1); }}
              className="rounded"
            />
            Incluir anulados
          </label>
          {(method || fromDate || toDate || includeVoided) && (
            <Button variant="ghost" size="sm" className="text-xs h-8 pb-0.5" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[hsl(var(--muted)/0.4)]">
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">Fecha</th>
              <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Monto</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden sm:table-cell whitespace-nowrap">Método</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell whitespace-nowrap">Cuenta de cobro</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden lg:table-cell">Referencia</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">Cargando…</td></tr>
            )}
            {isError && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[hsl(var(--destructive))]">Error al cargar los pagos.</td></tr>
            )}
            {!isLoading && !isError && payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  No hay pagos para los filtros aplicados
                </td>
              </tr>
            )}
            {payments.map((p) => {
              const isVoided = !!p.voidedAt;
              return (
                <tr
                  key={p.id}
                  className={cn(
                    'border-b last:border-0 transition-colors',
                    isVoided
                      ? 'opacity-50'
                      : 'hover:bg-[hsl(var(--muted)/0.3)]',
                  )}
                >
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] text-xs whitespace-nowrap">
                    {format(parseISO(p.paidAt), 'd MMM yyyy', { locale: es })}
                  </td>
                  <td className={cn(
                    'px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap',
                    isVoided && 'line-through',
                  )}>
                    {formatMoney(p.amount)}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[hsl(var(--muted-foreground))] text-xs">
                    {METHOD_LABELS[p.method]}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <button
                      className="font-mono text-xs text-[hsl(var(--primary))] hover:underline"
                      onClick={() => navigate(`/cuentas-cobro/${p.invoice.id}`)}
                    >
                      {p.invoice.number}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {p.invoice.client.tradeName ?? p.invoice.client.legalName}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-[hsl(var(--muted-foreground))] text-xs">
                    {p.reference ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {isVoided ? (
                      <Badge variant="danger">Anulado</Badge>
                    ) : (
                      <Badge variant="success">Válido</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals summary */}
      {!isLoading && payments.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm space-y-1 min-w-[220px]">
            {meta && (
              <p className="text-[hsl(var(--muted-foreground))]">
                {meta.total} pago{meta.total !== 1 ? 's' : ''} encontrado{meta.total !== 1 ? 's' : ''}
              </p>
            )}
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Total página</span>
              <span className="tabular-nums">
                {formatMoney(
                  payments
                    .filter((p) => !p.voidedAt)
                    .reduce((s, p) => s + parseFloat(p.amount), 0),
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
          <span>Página {meta.page} de {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
