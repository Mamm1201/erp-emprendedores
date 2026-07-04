import type { WorkOrder } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkOrderItemsCardProps {
  workOrder: WorkOrder;
}

export function WorkOrderItemsCard({ workOrder }: WorkOrderItemsCardProps) {
  const { items, subtotal, discountTotal, taxTotal, total } = workOrder;
  const hasItems = items && items.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          Líneas de servicio
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">

        {!hasItems && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] px-6 pb-5">
            Esta orden no tiene líneas de servicio registradas.
          </p>
        )}

        {hasItems && (
          <>
            {/* Scrollable table on small screens */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-[hsl(var(--muted)/0.4)]">
                    <th className="px-6 py-2.5 text-left font-medium text-[hsl(var(--muted-foreground))] w-full">
                      Descripción
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                      Cant.
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap hidden sm:table-cell">
                      P. unitario
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap hidden md:table-cell">
                      Descuento
                    </th>
                    <th className="px-6 py-2.5 text-right font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                      Total línea
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items!.map((item) => (
                    <tr key={item.id} className="hover:bg-[hsl(var(--muted)/0.2)]">
                      <td className="px-6 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">
                        {parseFloat(item.quantity).toLocaleString('es-CO', { maximumFractionDigits: 3 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-xs hidden sm:table-cell">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-xs hidden md:table-cell">
                        {parseFloat(item.discountAmount) > 0
                          ? formatMoney(item.discountAmount)
                          : '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-mono tabular-nums text-xs font-medium">
                        {formatMoney(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t px-6 py-4 flex justify-end">
              <div className="space-y-1.5 min-w-[200px]">
                <div className="flex justify-between text-sm text-[hsl(var(--muted-foreground))]">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">{formatMoney(subtotal)}</span>
                </div>
                {parseFloat(discountTotal) > 0 && (
                  <div className="flex justify-between text-sm text-[hsl(var(--muted-foreground))]">
                    <span>Descuento</span>
                    <span className="font-mono tabular-nums text-amber-signal">
                      − {formatMoney(discountTotal)}
                    </span>
                  </div>
                )}
                {parseFloat(taxTotal) > 0 && (
                  <div className="flex justify-between text-sm text-[hsl(var(--muted-foreground))]">
                    <span>Impuestos</span>
                    <span className="font-mono tabular-nums">{formatMoney(taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t pt-1.5 mt-1.5">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">{formatMoney(total)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
