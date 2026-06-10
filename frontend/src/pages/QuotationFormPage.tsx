import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

import { useQuotation, useCreateQuotation, useUpdateQuotation, type QuotationFormData } from '@/hooks/use-quotations';
import { useClients } from '@/hooks/use-clients';
import { useBranches } from '@/hooks/use-branches';
import { calcLineTotal, formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ─── Schema ───────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  description: z.string().min(1, 'Descripción requerida').max(500),
  quantity: z.number({ invalid_type_error: 'Número requerido' }).min(0.001),
  unitPrice: z.number({ invalid_type_error: 'Número requerido' }).min(0),
  discountAmount: z.number().min(0).optional().default(0),
  taxRate: z.number().min(0).max(100).optional().default(0),
});

const formSchema = z.object({
  clientId: z.string().min(1, 'Selecciona un cliente'),
  branchId: z.string().optional(),
  validUntil: z.string().optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
  terms: z.string().max(5000).optional().or(z.literal('')),
  items: z.array(itemSchema).min(1, 'Agrega al menos un ítem'),
});

type FormSchema = z.infer<typeof formSchema>;

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50';

const DEFAULT_ITEM = { description: '', quantity: 1, unitPrice: 0, discountAmount: 0, taxRate: 0 };

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
            <span className="tabular-nums text-green-600">− {formatMoney(discountTotal)}</span>
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

  const { data: existing, isLoading: loadingExisting } = useQuotation(id ?? null);
  const createQ = useCreateQuotation();
  const updateQ = useUpdateQuotation();
  const isPending = createQ.isPending || updateQ.isPending;

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
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      branchId: '',
      validUntil: '',
      notes: '',
      terms: '',
      items: [DEFAULT_ITEM],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedClientId = watch('clientId');
  const watchedItems = useWatch({ control, name: 'items' });
  const { data: branches } = useBranches(watchedClientId || null);

  const isReadOnly = isEditing && existing && existing.status !== 'DRAFT';

  useEffect(() => {
    if (existing) {
      reset({
        clientId: existing.clientId,
        branchId: existing.branchId ?? '',
        validUntil: existing.validUntil ? existing.validUntil.slice(0, 10) : '',
        notes: existing.notes ?? '',
        terms: existing.terms ?? '',
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

  if (isEditing && loadingExisting) {
    return <div className="p-6 text-[hsl(var(--muted-foreground))]">Cargando cotización…</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cotizaciones')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? `Cotización ${existing?.number ?? ''}` : 'Nueva cotización'}
          </h1>
          {isReadOnly && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
              Solo se pueden editar cotizaciones en estado Borrador
            </p>
          )}
        </div>
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
    </div>
  );
}
