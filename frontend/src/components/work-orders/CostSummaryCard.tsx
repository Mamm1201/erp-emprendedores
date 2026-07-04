import type { Expense, ExpenseCategory, WorkOrder } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORY_LABEL } from '@/lib/expense-constants';
import { cn } from '@/lib/utils';

// ─── Margin color thresholds ──────────────────────────────────────────────────

function marginColor(pct: number): string {
  if (pct >= 40)  return 'text-node-teal';
  if (pct >= 20)  return 'text-amber-signal';
  return 'text-alert-red';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CostSummaryCardProps {
  workOrder: WorkOrder;
  expenses: Expense[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CostSummaryCard({ workOrder, expenses }: CostSummaryCardProps) {
  if (expenses.length === 0) return null;

  const { invoice, total: woTotal } = workOrder;

  // Revenue: use invoice total when available, otherwise OT total (estimated)
  const isEstimated   = !invoice || invoice.status === 'DRAFT';
  const revenueSource = invoice?.status && ['ISSUED', 'PARTIALLY_PAID', 'PAID'].includes(invoice.status)
    ? 'invoice'
    : 'workorder';

  // The invoice.total is not embedded in WorkOrder — we use workOrder.total as the canonical
  // revenue figure in both cases. When invoice is confirmed, the amounts match (same line items).
  const revenue = parseFloat(woTotal);

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          Rentabilidad
        </CardTitle>
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

        {/* Margin */}
        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">{isLoss ? 'Pérdida bruta' : 'Margen bruto'}</span>
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
        </div>

      </CardContent>
    </Card>
  );
}
