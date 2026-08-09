import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Trash2, ArrowLeft, Save, FileDown, ChevronRight } from 'lucide-react';
import { getApiToken } from '@/lib/api';

import {
  useQuotation,
  useCreateQuotation,
  useUpdateQuotation,
  useUpdateQuotationStatus,
  type QuotationFormData,
} from '@/hooks/use-quotations';
import { useCreateWorkOrder } from '@/hooks/use-work-orders';
import { useClients } from '@/hooks/use-clients';
import { useBranches } from '@/hooks/use-branches';
import { useRetentionRates } from '@/hooks/use-retention-rates';
import { calcLineTotal, formatMoney } from '@/lib/money';
import { RetentionsEstimateSection } from '@/components/quotations/RetentionsEstimateSection';
import type { QuotationStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── Status labels / badges ──────────────────────────────────────────────────

const STATUS_LABELS: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  CONVERTED: 'Convertida',
  CANCELLED: 'Cancelada',
};

const STATUS_BADGE: Record<QuotationStatus, 'secondary' | 'info' | 'success' | 'danger' | 'warning'> = {
  DRAFT: 'secondary',
  SENT: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'warning',
  CONVERTED: 'info',
  CANCELLED: 'danger',
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  description: z.string().min(1, 'Descripción requerida').max(500),
  quantity: z.number().min(0.001, 'Número requerido'),
  unitPrice: z.number().min(0, 'Número requerido'),
  discountAmount: z.number().min(0).optional().default(0),
  taxRate: z.number().min(0).max(100).optional().default(0),
});

const formSchema = z.object({
  clientId: z.string().min(1, 'Selecciona un cliente'),
  branchId: z.string().optional(),
  validUntil: z.string().optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
  terms: z.string().max(5000).optional().or(z.literal('')),
  retentionsApplied: z.boolean().optional().default(false),
  items: z.array(itemSchema).min(1, 'Agrega al menos un ítem'),
});

type FormSchema = z.infer<typeof formSchema>;

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50';

const DEFAULT_ITEM = { description: '', quantity: 1, unitPrice: 0, discountAmount: 0, taxRate: 0 };

// ─── Notes dialog ─────────────────────────────────────────────────────────────

function NotesDialog({
  open,
  nextStatus,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  nextStatus: 'REJECTED' | 'CANCELLED';
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isPending: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const title = nextStatus === 'REJECTED' ? 'Rechazar cotización' : 'Cancelar cotización';
  const placeholder =
    nextStatus === 'REJECTED'
      ? 'Motivo del rechazo (precio, presupuesto, competidor…)'
      : 'Motivo de cancelación';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <Textarea ref={ref} rows={3} placeholder={placeholder} className="text-sm" />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>Volver</Button>
          </DialogClose>
          <Button
            variant={nextStatus === 'REJECTED' ? 'destructive' : 'outline'}
            onClick={() => onConfirm(ref.current?.value.trim() || undefined)}
            disabled={isPending}
          >
            {isPending ? 'Guardando…' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── TotalsFooter ─────────────────────────────────────────────────────────────

function TotalsFooter({ items }: { items: FormSchema['items'] }) {
  let subtotal = 0, discountTotal = 0, taxTotal = 0, total = 0;
  for (const item of items) {
    const { lineSubtotal, lineTotal } = calcLineTotal(
      item.quantity ?? 0,
      item.unitPrice ?? 0,
      item.discountAmount ?? 0,
      item.taxRate ?? 0,
    );
    subtotal += lineSubtotal;
    discountTotal += item.discountAmount ?? 0;
    taxTotal += lineTotal - lineSubtotal;
    total += lineTotal;
  }

  return (
    <div className="flex justify-end mt-2">
      <div className="text-sm space-y-1 min-w-[240px]">
        <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatMoney(subtotal)}</span>
        </div>
        {discountTotal > 0 && (
          <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
            <span>Descuentos</span>
            <span className="tabular-nums text-node-teal">− {formatMoney(discountTotal)}</span>
          </div>
        )}
        {taxTotal > 0 && (
          <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
            <span>IVA / Impuestos</span>
            <span className="tabular-nums">{formatMoney(taxTotal)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t pt-1">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(total)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── LineItemRow ──────────────────────────────────────────────────────────────

function LineItemRow({
  index,
  register,
  errors,
  onRemove,
  canRemove,
  watchedItem,
}: {
  index: number;
  register: ReturnType<typeof useForm<FormSchema>>['register'];
  errors: any;
  onRemove: () => void;
  canRemove: boolean;
  watchedItem: FormSchema['items'][number];
}) {
  const { lineTotal } = calcLineTotal(
    watchedItem?.quantity ?? 0,
    watchedItem?.unitPrice ?? 0,
    watchedItem?.discountAmount ?? 0,
    watchedItem?.taxRate ?? 0,
  );

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-2">
        <Input
          {...register(`items.${index}.description`)}
          placeholder="Descripción del servicio o ítem"
          className="h-8 text-xs"
        />
        {errors?.items?.[index]?.description && (
          <p className="text-xs text-[hsl(var(--destructive))] mt-0.5">
            {errors.items[index].description.message}
          </p>
        )}
      </td>
      <td className="py-2 px-1 w-20">
        <Input
          type="number"
          step="0.001"
          min="0.001"
          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
          className="h-8 text-xs text-right"
        />
      </td>
      <td className="py-2 px-1 w-28">
        <Input
          type="number"
          step="1"
          min="0"
          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
          placeholder="0"
          className="h-8 text-xs text-right"
        />
      </td>
      <td className="py-2 px-1 w-24">
        <Input
          type="number"
          step="1"
          min="0"
          {...register(`items.${index}.discountAmount`, { valueAsNumber: true })}
          placeholder="0"
          className="h-8 text-xs text-right"
        />
      </td>
      <td className="py-2 px-1 w-16">
        <Input
          type="number"
          step="0.01"
          min="0"
          max="100"
          {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
          placeholder="0"
          className="h-8 text-xs text-right"
        />
      </td>
      <td className="py-2 pl-2 w-28 text-right text-sm font-medium tabular-nums whitespace-nowrap">
        {formatMoney(lineTotal)}
      </td>
      <td className="py-2 pl-1 w-8">
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── QuotationFormPage ────────────────────────────────────────────────────────

export function QuotationFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [notesDialog, setNotesDialog] = useState<'REJECTED' | 'CANCELLED' | null>(null);

  const { data: existing, isLoading: loadingExisting } = useQuotation(id ?? null);
  const createQ = useCreateQuotation();
  const updateQ = useUpdateQuotation();
  const updateStatus = useUpdateQuotationStatus();
  const createWO = useCreateWorkOrder();
  const isPending = createQ.isPending || updateQ.isPending;
  const isStatusBusy = updateStatus.isPending || createWO.isPending;

  const { data: clientsData } = useClients('', 1);
  const clients = clientsData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema) as Resolver<FormSchema>,
    defaultValues: {
      clientId: '',
      branchId: '',
      validUntil: '',
      notes: '',
      terms: '',
      retentionsApplied: false,
      items: [DEFAULT_ITEM],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedClientId = watch('clientId');
  const watchedBranchId = watch('branchId');
  const watchedRetentionsApplied = watch('retentionsApplied');
  const watchedItems = useWatch({ control, name: 'items' });
  const { data: branches } = useBranches(watchedClientId || null);
  const { data: retentionRates, isLoading: retentionRatesLoading } = useRetentionRates();

  const isReadOnly = isEditing && existing && existing.status !== 'DRAFT';

  const selectedBranch = (branches ?? []).find((b) => b.id === watchedBranchId);
  const branchCity = selectedBranch?.city ?? (isEditing ? existing?.branchCity ?? null : null);

  let retSubtotal = 0, retDiscountTotal = 0, retTotal = 0;
  for (const item of watchedItems ?? []) {
    const { lineSubtotal, lineTotal } = calcLineTotal(
      item.quantity ?? 0,
      item.unitPrice ?? 0,
      item.discountAmount ?? 0,
      item.taxRate ?? 0,
    );
    retSubtotal += lineSubtotal;
    retDiscountTotal += item.discountAmount ?? 0;
    retTotal += lineTotal;
  }

  useEffect(() => {
    if (existing) {
      reset({
        clientId: existing.clientId,
        branchId: existing.branchId ?? '',
        validUntil: existing.validUntil ? existing.validUntil.slice(0, 10) : '',
        notes: existing.notes ?? '',
        terms: existing.terms ?? '',
        retentionsApplied: existing.retentionsApplied,
        items: existing.items?.map((i) => ({
          description: i.description,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
          discountAmount: parseFloat(i.discountAmount),
          taxRate: parseFloat(i.taxRate),
        })) ?? [DEFAULT_ITEM],
      });
    }
  }, [existing, reset]);

  async function onSubmit(values: FormSchema) {
    const dto: QuotationFormData = {
      clientId: values.clientId,
      branchId: values.branchId || undefined,
      validUntil: values.validUntil || undefined,
      notes: values.notes || undefined,
      terms: values.terms || undefined,
      retentionsApplied: values.retentionsApplied ?? false,
      items: values.items.map((item, idx) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount ?? 0,
        taxRate: item.taxRate ?? 0,
        lineOrder: idx,
      })),
    };

    if (isEditing && id) {
      await updateQ.mutateAsync({ id, data: dto });
      navigate('/cotizaciones');
    } else {
      await createQ.mutateAsync(dto);
      navigate('/cotizaciones');
    }
  }

  async function convertToWorkOrder() {
    if (!existing) return;
    await createWO.mutateAsync({
      clientId: existing.clientId,
      branchId: existing.branchId ?? undefined,
      quotationId: existing.id,
      title: `Visita técnica — ${existing.clientLegalName ?? existing.client.legalName}`,
    });
    navigate('/ordenes');
  }

  async function handleNotesConfirm(notes?: string) {
    if (!id || !notesDialog) return;
    await updateStatus.mutateAsync({ id, status: notesDialog, notes });
    setNotesDialog(null);
  }

  function fmtDate(iso: string | null | undefined) {
    if (!iso) return null;
    return format(parseISO(iso), "d MMM yyyy", { locale: es });
  }

  if (isEditing && loadingExisting) {
    return <div className="p-6 text-[hsl(var(--muted-foreground))]">Cargando cotización…</div>;
  }

  const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

  async function downloadPdf() {
    if (!id) return;
    const token = getApiToken();
    const res = await fetch(`${BASE_URL}/documents/quotations/${id}/pdf`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotizacion-${existing?.number ?? id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Button variant="ghost" size="icon" className="shrink-0 mt-0.5" onClick={() => navigate('/cotizaciones')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">
            {isEditing ? `Cotización ${existing?.number ?? ''}` : 'Nueva cotización'}
          </h1>
          {isEditing && existing && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={STATUS_BADGE[existing.status]}>{STATUS_LABELS[existing.status]}</Badge>
              {existing.status === 'SENT' && existing.sentAt && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Enviada el {fmtDate(existing.sentAt)}</span>
              )}
              {existing.status === 'APPROVED' && existing.approvedAt && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Aprobada el {fmtDate(existing.approvedAt)}</span>
              )}
              {existing.status === 'REJECTED' && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Rechazada{existing.rejectedAt ? ` el ${fmtDate(existing.rejectedAt)}` : ''}
                  {existing.rejectionNotes ? ` · "${existing.rejectionNotes}"` : ''}
                </span>
              )}
              {existing.status === 'CANCELLED' && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Cancelada{existing.cancelledAt ? ` el ${fmtDate(existing.cancelledAt)}` : ''}
                  {existing.cancellationNotes ? ` · "${existing.cancellationNotes}"` : ''}
                </span>
              )}
              {existing.status === 'CONVERTED' && existing.workOrder && (
                <button
                  type="button"
                  className="text-xs text-node-teal underline-offset-2 hover:underline"
                  onClick={() => navigate(`/ordenes/${existing.workOrder!.id}`)}
                >
                  Ver OT {existing.workOrder.number}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action buttons — visible on non-DRAFT statuses */}
        {isEditing && existing && (
          <div className="flex gap-2 flex-wrap items-center shrink-0">
            {existing.status === 'DRAFT' && (
              <Button type="button" size="sm" variant="outline" className="gap-1" disabled={isStatusBusy}
                onClick={() => updateStatus.mutate({ id: existing.id, status: 'SENT' })}>
                Enviar cotización <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
            {existing.status === 'SENT' && (
              <>
                <Button type="button" size="sm" variant="outline"
                  className="gap-1 text-node-teal border-node-teal/30 hover:bg-node-teal/10"
                  disabled={isStatusBusy}
                  onClick={() => updateStatus.mutate({ id: existing.id, status: 'APPROVED' })}>
                  Aprobar
                </Button>
                <Button type="button" size="sm" variant="ghost"
                  className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
                  disabled={isStatusBusy}
                  onClick={() => setNotesDialog('REJECTED')}>
                  Rechazar
                </Button>
              </>
            )}
            {existing.status === 'APPROVED' && (
              <Button type="button" size="sm"
                className="gap-1 bg-node-teal hover:bg-node-teal-deep text-white"
                disabled={isStatusBusy}
                onClick={convertToWorkOrder}>
                {createWO.isPending ? 'Creando OT…' : 'Generar OT'}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
            {(existing.status === 'SENT' || existing.status === 'APPROVED') && (
              <Button type="button" size="sm" variant="ghost"
                className="text-[hsl(var(--muted-foreground))]"
                disabled={isStatusBusy}
                onClick={() => setNotesDialog('CANCELLED')}>
                Cancelar
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={downloadPdf} className="gap-2">
              <FileDown className="h-4 w-4" />
              PDF
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Client + branch + validUntil */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg border">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <select {...register('clientId')} disabled={isEditing || !!isReadOnly} className={SELECT_CLASS}>
              <option value="">Seleccionar cliente…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.tradeName ?? c.legalName}</option>
              ))}
            </select>
            {errors.clientId && <p className="text-xs text-[hsl(var(--destructive))]">{errors.clientId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Sede</Label>
            <select {...register('branchId')} disabled={isEditing || !watchedClientId || !branches?.length} className={SELECT_CLASS}>
              <option value="">Sin sede específica</option>
              {(branches ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}{b.city ? ` — ${b.city}` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Válida hasta</Label>
            <Input type="date" {...register('validUntil')} disabled={!!isReadOnly} />
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Ítems de la cotización</h2>
            {!isReadOnly && (
              <Button type="button" variant="outline" size="sm" className="gap-1 text-xs h-7"
                onClick={() => append(DEFAULT_ITEM)}>
                <Plus className="h-3 w-3" /> Agregar ítem
              </Button>
            )}
          </div>
          {errors.items?.root && (
            <p className="text-xs text-[hsl(var(--destructive))]">{errors.items.root.message}</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">Descripción</th>
                  <th className="pb-2 px-1 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] w-20">Cant.</th>
                  <th className="pb-2 px-1 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] w-28">Precio unit.</th>
                  <th className="pb-2 px-1 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] w-24">Descuento</th>
                  <th className="pb-2 px-1 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] w-16">IVA %</th>
                  <th className="pb-2 pl-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] w-28">Total línea</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <LineItemRow
                    key={field.id}
                    index={index}
                    register={register}
                    errors={errors}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1 && !isReadOnly}
                    watchedItem={watchedItems?.[index] ?? DEFAULT_ITEM}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <TotalsFooter items={watchedItems ?? []} />
        </div>

        {/* Retenciones (RETE FUENTE / RETE ICA) — estimado informativo, no afecta el total */}
        <div className="rounded-lg border p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              {...register('retentionsApplied')}
              disabled={!!isReadOnly}
              className="h-4 w-4 rounded border-[hsl(var(--input))]"
            />
            Aplicar retenciones (estimado)
          </label>

          {watchedRetentionsApplied && (
            <RetentionsEstimateSection
              rates={retentionRates ?? []}
              ratesLoading={retentionRatesLoading}
              branchCity={branchCity}
              subtotal={retSubtotal}
              discountTotal={retDiscountTotal}
              total={retTotal}
            />
          )}
        </div>

        {/* Notes + Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Notas internas</Label>
            <Textarea {...register('notes')} rows={3} placeholder="Observaciones del servicio…" disabled={!!isReadOnly} />
          </div>
          <div className="space-y-1.5">
            <Label>Términos y condiciones</Label>
            <Textarea {...register('terms')} rows={3} placeholder="Condiciones de pago, garantías…" disabled={!!isReadOnly} />
          </div>
        </div>

        {/* Error + submit */}
        {(createQ.error || updateQ.error) && (
          <p className="text-sm text-[hsl(var(--destructive))]">
            {(createQ.error ?? updateQ.error)?.message}
          </p>
        )}

        {!isReadOnly && (
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/cotizaciones')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar cotización'}
            </Button>
          </div>
        )}
      </form>

      {notesDialog && (
        <NotesDialog
          open
          nextStatus={notesDialog}
          onClose={() => setNotesDialog(null)}
          onConfirm={handleNotesConfirm}
          isPending={updateStatus.isPending}
        />
      )}
    </div>
  );
}
