import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, PlusCircle, XCircle, FileDown, FileSignature } from 'lucide-react';

import {
  useInvoice,
  useUpdateInvoiceStatus,
  useCreatePayment,
  useVoidPayment,
} from '@/hooks/use-invoices';
import type { InvoiceStatus, Payment, PaymentMethod } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { getApiToken } from '@/lib/api';
import { ShareDocumentButton } from '@/components/shared/ShareDocumentButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── Labels ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Borrador',
  ISSUED: 'Emitida',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagada',
  VOID: 'Anulada',
};

const STATUS_BADGE: Record<
  InvoiceStatus,
  'secondary' | 'info' | 'warning' | 'success' | 'danger'
> = {
  DRAFT: 'secondary',
  ISSUED: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  VOID: 'danger',
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
};

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function downloadInvoicePdf(invoiceId: string, invoiceNumber: string) {
  const token = getApiToken();
  const res = await fetch(`${BASE_URL}/documents/invoices/${invoiceId}/pdf`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cuenta-cobro-${invoiceNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── PaymentDialog ─────────────────────────────────────────────────────────────

const paySchema = z.object({
  amount: z.number().min(0.01, 'Ingresa un monto'),
  paidAt: z.string().optional().or(z.literal('')),
  method: z.string().optional(),
  reference: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

type PaySchema = z.infer<typeof paySchema>;

function PaymentDialog({
  invoiceId,
  open,
  onClose,
}: {
  invoiceId: string;
  open: boolean;
  onClose: () => void;
}) {
  const createPayment = useCreatePayment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paySchema),
    defaultValues: { amount: 0, paidAt: '', method: 'TRANSFER', reference: '', notes: '' },
  });

  async function onSubmit(values: PaySchema) {
    await createPayment.mutateAsync({
      invoiceId,
      data: {
        amount: values.amount,
        paidAt: values.paidAt || undefined,
        method: (values.method as PaymentMethod) || undefined,
        reference: values.reference || undefined,
        notes: values.notes || undefined,
      },
    });
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Monto *</Label>
            <Input
              type="number"
              step="1"
              min="1"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.amount && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.amount.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de pago</Label>
            <Input type="date" {...register('paidAt')} />
          </div>
          <div className="space-y-1.5">
            <Label>Método</Label>
            <select {...register('method')} className={SELECT_CLASS}>
              <option value="TRANSFER">Transferencia</option>
              <option value="CASH">Efectivo</option>
              <option value="CHECK">Cheque</option>
              <option value="CARD">Tarjeta</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Referencia</Label>
            <Input
              {...register('reference')}
              placeholder="N° transferencia, cheque…"
            />
          </div>
          {createPayment.error && (
            <p className="text-xs text-[hsl(var(--destructive))]">
              {createPayment.error.message}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={createPayment.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createPayment.isPending}>
              {createPayment.isPending ? 'Guardando…' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── VoidDialog ────────────────────────────────────────────────────────────────

function VoidDialog({
  invoiceId,
  open,
  onClose,
}: {
  invoiceId: string;
  open: boolean;
  onClose: () => void;
}) {
  const updateStatus = useUpdateInvoiceStatus();
  const [reason, setReason] = useState('');

  async function handleVoid() {
    await updateStatus.mutateAsync({
      id: invoiceId,
      status: 'VOID',
      voidReason: reason || undefined,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Anular cuenta de cobro</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Esta acción es irreversible. La cuenta de cobro quedará anulada.
          </p>
          <div className="space-y-1.5">
            <Label>Motivo (opcional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Razón de la anulación…"
            />
          </div>
          {updateStatus.error && (
            <p className="text-xs text-[hsl(var(--destructive))]">
              {updateStatus.error.message}
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={updateStatus.isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleVoid} disabled={updateStatus.isPending}>
            {updateStatus.isPending ? 'Anulando…' : 'Anular'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── PaymentRow ────────────────────────────────────────────────────────────────

function PaymentRow({
  payment,
  invoiceId,
}: {
  payment: Payment;
  invoiceId: string;
}) {
  const voidPayment = useVoidPayment();
  const isVoided = !!payment.voidedAt;

  return (
    <tr className={`border-b last:border-0 ${isVoided ? 'opacity-40' : ''}`}>
      <td className="py-2 pr-4 text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
        {format(parseISO(payment.paidAt), 'd MMM yyyy', { locale: es })}
      </td>
      <td className="py-2 pr-4 text-sm font-medium tabular-nums">
        {isVoided ? (
          <span className="line-through">{formatMoney(payment.amount)}</span>
        ) : (
          formatMoney(payment.amount)
        )}
      </td>
      <td className="py-2 pr-4 text-xs text-[hsl(var(--muted-foreground))]">
        {METHOD_LABELS[payment.method]}
      </td>
      <td className="py-2 pr-4 text-xs text-[hsl(var(--muted-foreground))]">
        {payment.reference ?? '—'}
      </td>
      <td className="py-2 text-right">
        {!isVoided && (
          <button
            title="Anular pago"
            disabled={voidPayment.isPending}
            onClick={() =>
              voidPayment.mutate({ invoiceId, paymentId: payment.id })
            }
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] disabled:opacity-50 transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
        {isVoided && (
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Anulado</span>
        )}
      </td>
    </tr>
  );
}

// ─── InvoiceDetailPage ─────────────────────────────────────────────────────────

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);

  const { data: invoice, isLoading, isError } = useInvoice(id ?? null);
  const updateStatus = useUpdateInvoiceStatus();

  if (isLoading) {
    return <div className="p-6 text-[hsl(var(--muted-foreground))]">Cargando…</div>;
  }

  if (isError || !invoice) {
    return (
      <div className="p-6">
        <p className="text-[hsl(var(--destructive))]">No se encontró la cuenta de cobro.</p>
        <Button variant="ghost" className="mt-2" onClick={() => navigate('/cuentas-cobro')}>
          Volver
        </Button>
      </div>
    );
  }

  const payments = invoice.payments ?? [];
  const activePayments = payments.filter((p) => !p.voidedAt);
  const paidTotal = activePayments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const pending = parseFloat(invoice.total) - paidTotal;
  const overdue =
    invoice.status !== 'PAID' &&
    invoice.status !== 'VOID' &&
    new Date(invoice.dueDate) < new Date();

  const canIssue = invoice.status === 'DRAFT';
  const canPay = invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID';
  const canVoid =
    invoice.status === 'DRAFT' ||
    invoice.status === 'ISSUED' ||
    invoice.status === 'PARTIALLY_PAID';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cuentas-cobro')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{invoice.number}</h1>
            <Badge variant={STATUS_BADGE[invoice.status]}>
              {STATUS_LABELS[invoice.status]}
            </Badge>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            {invoice.client.tradeName ?? invoice.client.legalName}
            {invoice.workOrder && (
              <> · <span className="font-mono">{invoice.workOrder.number}</span></>
            )}
            {invoice.contract && (
              <> · <FileSignature className="inline h-3.5 w-3.5 mx-0.5 -mt-0.5" /><span className="font-mono">{invoice.contract.number}</span></>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap justify-end">
          {canIssue && (
            <Button
              size="sm"
              disabled={updateStatus.isPending}
              onClick={() =>
                updateStatus.mutate({ id: invoice.id, status: 'ISSUED' })
              }
            >
              Emitir
            </Button>
          )}
          {canPay && (
            <Button
              size="sm"
              className="gap-1"
              onClick={() => setShowPayDialog(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Registrar pago
            </Button>
          )}
          {canVoid && (
            <Button
              size="sm"
              variant="outline"
              className="text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.3)] hover:bg-[hsl(var(--destructive)/0.1)]"
              onClick={() => setShowVoidDialog(true)}
            >
              Anular
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => downloadInvoicePdf(invoice.id, invoice.number)}
          >
            <FileDown className="h-4 w-4" />
            Descargar CC
          </Button>
          <ShareDocumentButton key={invoice.id} type="INVOICE" documentId={invoice.id} documentNumber={invoice.number} />
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg border text-sm">
        <div>
          <p className="text-[hsl(var(--muted-foreground))] text-xs mb-0.5">Emisión</p>
          <p>{format(parseISO(invoice.issueDate), 'd MMM yyyy', { locale: es })}</p>
        </div>
        <div>
          <p className="text-[hsl(var(--muted-foreground))] text-xs mb-0.5">Vencimiento</p>
          <p className={overdue ? 'text-alert-red font-medium' : ''}>
            {format(parseISO(invoice.dueDate), 'd MMM yyyy', { locale: es })}
            {overdue && ' ⚠'}
          </p>
        </div>
        {invoice.workOrder && (
          <div>
            <p className="text-[hsl(var(--muted-foreground))] text-xs mb-0.5">OT vinculada</p>
            <button
              className="font-mono text-[hsl(var(--primary))] hover:underline"
              onClick={() => navigate(`/ordenes/${invoice.workOrder!.id}`)}
            >
              {invoice.workOrder.number}
            </button>
          </div>
        )}
        {invoice.contract && (
          <div>
            <p className="text-[hsl(var(--muted-foreground))] text-xs mb-0.5">Contrato vinculado</p>
            <button
              className="font-mono text-[hsl(var(--primary))] hover:underline"
              onClick={() => navigate(`/contratos/${invoice.contract!.id}`)}
            >
              {invoice.contract.number}
            </button>
          </div>
        )}
        {invoice.voidedAt && (
          <div>
            <p className="text-[hsl(var(--muted-foreground))] text-xs mb-0.5">Anulada el</p>
            <p className="text-alert-red">
              {format(parseISO(invoice.voidedAt), 'd MMM yyyy', { locale: es })}
            </p>
          </div>
        )}
      </div>

      {invoice.notes && (
        <div className="p-3 rounded-lg bg-[hsl(var(--muted)/0.5)] text-sm">
          <p className="text-[hsl(var(--muted-foreground))] text-xs mb-1">Notas</p>
          <p>{invoice.notes}</p>
        </div>
      )}

      {/* Items */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-sm font-semibold">Ítems</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="pb-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">Descripción</th>
              <th className="pb-2 px-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] w-16">Cant.</th>
              <th className="pb-2 px-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] w-28">Precio unit.</th>
              <th className="pb-2 pl-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items ?? []).map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2 pr-2">{item.description}</td>
                <td className="py-2 px-2 text-right text-[hsl(var(--muted-foreground))]">
                  {parseFloat(item.quantity)}
                </td>
                <td className="py-2 px-2 text-right text-[hsl(var(--muted-foreground))] tabular-nums">
                  {formatMoney(item.unitPrice)}
                </td>
                <td className="py-2 pl-2 text-right font-medium tabular-nums">
                  {formatMoney(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="text-sm space-y-1 min-w-[200px]">
            <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoney(invoice.subtotal)}</span>
            </div>
            {parseFloat(invoice.discountTotal) > 0 && (
              <div className="flex justify-between text-node-teal">
                <span>Descuentos</span>
                <span className="tabular-nums">− {formatMoney(invoice.discountTotal)}</span>
              </div>
            )}
            {parseFloat(invoice.taxTotal) > 0 && (
              <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
                <span>IVA</span>
                <span className="tabular-nums">{formatMoney(invoice.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-1">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Pagos</h2>
          {canPay && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 gap-1"
              onClick={() => setShowPayDialog(true)}
            >
              <PlusCircle className="h-3 w-3" />
              Agregar pago
            </Button>
          )}
        </div>

        {payments.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Sin pagos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">Fecha</th>
                <th className="pb-2 pr-4 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">Monto</th>
                <th className="pb-2 pr-4 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">Método</th>
                <th className="pb-2 pr-4 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">Referencia</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <PaymentRow key={p.id} payment={p} invoiceId={invoice.id} />
              ))}
            </tbody>
          </table>
        )}

        {/* Payment summary */}
        {(invoice.status === 'PARTIALLY_PAID' || invoice.status === 'PAID') && (
          <div className="border-t pt-3 flex justify-end gap-6 text-sm">
            <div className="text-[hsl(var(--muted-foreground))]">
              Pagado: <span className="font-semibold text-node-teal tabular-nums">{formatMoney(paidTotal)}</span>
            </div>
            {pending > 0.01 && (
              <div className="text-[hsl(var(--muted-foreground))]">
                Pendiente: <span className="font-semibold text-[hsl(var(--foreground))] tabular-nums">{formatMoney(pending)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <PaymentDialog
        invoiceId={invoice.id}
        open={showPayDialog}
        onClose={() => setShowPayDialog(false)}
      />
      <VoidDialog
        invoiceId={invoice.id}
        open={showVoidDialog}
        onClose={() => setShowVoidDialog(false)}
      />
    </div>
  );
}
