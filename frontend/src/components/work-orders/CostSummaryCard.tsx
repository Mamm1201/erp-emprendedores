import type { Expense, ExpenseCategory, WorkOrder } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_LABEL } from '@/lib/expense-constants';
import { cn } from '@/lib/utils';

// ─── Margin color thresholds ──────────────────────────────────────────────────

function marginColor(pct: number): string {
  if (pct >= 40)  return 'text-node-teal';
  if (pct >= 20)  return 'text-amber-signal';
  return 'text-alert-red';
}

// ─── Estado del ciclo económico de la OT ──────────────────────────────────────
// Deriva la etapa del ciclo desde el estado de la OT + el de su factura.
// La regla debe mantenerse coherente con el embudo del Pulso (T-09, backend).

type CycleBadge = { label: string; variant: 'secondary' | 'info' | 'warning' | 'success' };

function economicCycle(woStatus: string, invoiceStatus: string | undefined): CycleBadge {
  if (woStatus === 'CANCELLED') return { label: 'Cancelada', variant: 'secondary' };
  if (woStatus !== 'COMPLETED') return { label: 'En ejecución', variant: 'secondary' };
  if (invoiceStatus === 'PAID') return { label: 'Cobrada', variant: 'success' };
  if (invoiceStatus === 'ISSUED' || invoiceStatus === 'PARTIALLY_PAID') {
    return { label: 'Facturada sin cobrar', variant: 'info' };
  }
  return { label: 'Cerrada sin facturar', variant: 'warning' };
}

// ─── Firmeza del margen mostrado ──────────────────────────────────────────────
// Responsabilidad separada del ciclo económico: qué tan firme es el margen que se
// muestra. real = ingreso de factura firme · estimado/pendiente = sobre el estimado ·
// na = OT cancelada (no aplica análisis).

type MarginFirmness = 'real' | 'estimado' | 'pendiente' | 'na';

function marginFirmness(woStatus: string, revenueSource: 'invoice' | 'workorder'): MarginFirmness {
  if (woStatus === 'CANCELLED') return 'na';
  if (revenueSource === 'invoice') return 'real';
  if (woStatus === 'COMPLETED') return 'pendiente';
  return 'estimado';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CostSummaryCardProps {
  workOrder: WorkOrder;
  expenses: Expense[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CostSummaryCard({ workOrder, expenses }: CostSummaryCardProps) {
  if (expenses.length === 0) return null;

  const { invoice, total: woTotal, status } = workOrder;
  const cycle = economicCycle(status, invoice?.status);

  // Revenue: use invoice total when available, otherwise OT total (estimated)
  const isEstimated   = !invoice || invoice.status === 'DRAFT';
  const revenueSource = invoice?.status && ['ISSUED', 'PARTIALLY_PAID', 'PAID'].includes(invoice.status)
    ? 'invoice'
    : 'workorder';

  // Ingreso: en estados firmes (ISSUED/PARTIALLY_PAID/PAID) usamos invoice.total;
  // en el resto (sin factura, DRAFT, VOID) usamos el estimado de la OT.
  const invoiceTotal = invoice?.total;
  const revenue =
    revenueSource === 'invoice' && invoiceTotal != null
      ? parseFloat(invoiceTotal)
      : parseFloat(woTotal);

  // Aggregate costs
  const totalCost = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // Per-category subtotals (only categories that have expenses)
  const byCategory = expenses.reduce<Partial<Record<ExpenseCategory, number>>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + parseFloat(e.amount);
    return acc;
  }, {});

  const grossMargin = revenue - totalCost;
  const marginPct   = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
  const isLoss      = grossMargin < 0;

  // Firmeza del margen + recaudo de la factura (cobrado / saldo)
  const firmness = marginFirmness(status, revenueSource);
  const paid  = invoice?.paidTotal != null ? parseFloat(invoice.paidTotal) : 0;
  const saldo = (invoice?.total != null ? parseFloat(invoice.total) : 0) - paid;
  const marginLabel = firmness === 'real'
    ? (isLoss ? 'Pérdida bruta' : 'Margen bruto')
    : 'Margen estimado';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Rentabilidad
          </CardTitle>
          <Badge variant={cycle.variant}>{cycle.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* Revenue row */}
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">
              {revenueSource === 'invoice' ? 'Ingreso (facturado)' : 'Ingreso estimado'}
            </span>
            <span className="font-mono tabular-nums font-medium">{formatMoney(revenue)}</span>
          </div>
          {revenueSource === 'invoice' && (
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
              Cobrado {formatMoney(paid)} · saldo {formatMoney(saldo)}
            </p>
          )}
          {isEstimated && (
            <p className="text-[10px] text-amber-signal mt-0.5">
              Basado en líneas de OT · Se actualizará al facturar
            </p>
          )}
        </div>

        {/* Cost breakdown */}
        <div className="border-t pt-3 space-y-1.5">
          {(Object.entries(byCategory) as [ExpenseCategory, number][])
            .sort(([, a], [, b]) => b - a)
            .map(([cat, amount]) => (
              <div key={cat} className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                <span>{CATEGORY_LABEL[cat]}</span>
                <span className="font-mono tabular-nums">{formatMoney(amount)}</span>
              </div>
            ))}
          <div className="flex justify-between text-sm font-medium pt-1 border-t">
            <span>Total costos</span>
            <span className="font-mono tabular-nums">{formatMoney(totalCost)}</span>
          </div>
        </div>

        {/* Margin (o nota de OT cancelada) */}
        {firmness === 'na' ? (
          <p className="border-t pt-3 text-xs text-[hsl(var(--muted-foreground))]">
            OT cancelada · no aplica análisis de rentabilidad.
          </p>
        ) : (
          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{marginLabel}</span>
              <span className={cn('font-mono tabular-nums font-bold', marginColor(marginPct))}>
                {isLoss ? '− ' : ''}{formatMoney(Math.abs(grossMargin))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Margen</span>
              <span className={cn('text-lg font-bold font-mono tabular-nums', marginColor(marginPct))}>
                {marginPct.toFixed(1)} %
              </span>
            </div>
            {firmness === 'pendiente' && (
              <p className="text-[10px] text-amber-signal">Pendiente de facturación</p>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
