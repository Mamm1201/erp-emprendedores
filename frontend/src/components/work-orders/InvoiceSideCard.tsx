import type { WorkOrder } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const INVOICE_STATUS_LABEL: Record<string, string> = {
  DRAFT:          'Borrador',
  ISSUED:         'Emitida',
  PARTIALLY_PAID: 'Pago parcial',
  PAID:           'Pagada',
  VOID:           'Anulada',
};

const INVOICE_STATUS_VARIANT: Record<string, 'secondary' | 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT:          'secondary',
  ISSUED:         'info',
  PARTIALLY_PAID: 'warning',
  PAID:           'success',
  VOID:           'danger',
};

interface InvoiceSideCardProps {
  workOrder: WorkOrder;
  onCreateInvoice: () => void;
  onViewInvoice: () => void;
}

export function InvoiceSideCard({ workOrder, onCreateInvoice, onViewInvoice }: InvoiceSideCardProps) {
  const { invoice, status, total } = workOrder;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          Cuenta de cobro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!invoice ? (
          <>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {status === 'COMPLETED'
                ? 'La orden está completada. Puedes generar la cuenta de cobro.'
                : 'Se habilitará al completar la orden.'}
            </p>
            {status === 'COMPLETED' && (
              <button
                onClick={onCreateInvoice}
                className="w-full rounded-md border border-dashed border-[hsl(var(--border))] py-2 text-sm text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.05)] transition-colors"
              >
                + Crear cuenta de cobro
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium">{invoice.number}</span>
              <Badge variant={INVOICE_STATUS_VARIANT[invoice.status] ?? 'secondary'}>
                {INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}
              </Badge>
            </div>
            <p className="text-lg font-bold font-mono tabular-nums">
              {formatMoney(total)}
            </p>
            <button
              onClick={onViewInvoice}
              className="w-full text-sm text-[hsl(var(--primary))] underline-offset-2 hover:underline text-left"
            >
              Ver detalle →
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
