import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';

import { useCreateInvoice } from '@/hooks/use-invoices';
import { useWorkOrders } from '@/hooks/use-work-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '@/lib/money';

const formSchema = z.object({
  workOrderId: z.string().min(1, 'Selecciona una orden de trabajo'),
  dueDate: z.string().min(1, 'Fecha de vencimiento requerida'),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type FormSchema = z.infer<typeof formSchema>;

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50';

export function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const prefilledWoId = params.get('workOrderId') ?? '';

  const create = useCreateInvoice();

  // Get all completed work orders (up to 100)
  const { data: woData } = useWorkOrders({ status: 'COMPLETED', page: 1 });
  const completedOrders = (woData?.data ?? []).filter((wo) => !wo.invoice);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workOrderId: prefilledWoId,
      dueDate: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (prefilledWoId) setValue('workOrderId', prefilledWoId);
  }, [prefilledWoId, setValue]);

  const selectedWoId = watch('workOrderId');
  const selectedWo = woData?.data?.find((wo) => wo.id === selectedWoId);

  async function onSubmit(values: FormSchema) {
    const invoice = await create.mutateAsync({
      workOrderId: values.workOrderId,
      dueDate: values.dueDate,
      notes: values.notes || undefined,
    });
    navigate(`/cuentas-cobro/${invoice.id}`);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cuentas-cobro')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Nueva cuenta de cobro</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-lg border p-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Orden de trabajo ejecutada *</Label>
            <select {...register('workOrderId')} className={SELECT_CLASS}>
              <option value="">Seleccionar OT completada…</option>
              {completedOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.number} — {wo.client.tradeName ?? wo.client.legalName}
                  {wo.branch ? ` · ${wo.branch.name}` : ''} — {wo.title}
                </option>
              ))}
            </select>
            {errors.workOrderId && (
              <p className="text-xs text-[hsl(var(--destructive))]">
                {errors.workOrderId.message}
              </p>
            )}
            {woData && completedOrders.length === 0 && (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                No hay órdenes completadas sin cuenta de cobro. Completa una OT primero.
              </p>
            )}
          </div>

          {selectedWo && (
            <div className="rounded-md bg-[hsl(var(--muted)/0.5)] p-3 text-sm space-y-1">
              <p className="font-medium">{selectedWo.title}</p>
              <p className="text-[hsl(var(--muted-foreground))]">
                {selectedWo.client.tradeName ?? selectedWo.client.legalName}
                {selectedWo.branch ? ` · ${selectedWo.branch.name}` : ''}
              </p>
              <p className="font-semibold text-base mt-1">
                Total OT: {formatMoney(selectedWo.total)}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Los ítems de la OT se copiarán automáticamente a la cuenta de cobro.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Fecha de vencimiento *</Label>
            <Input type="date" {...register('dueDate')} />
            {errors.dueDate && (
              <p className="text-xs text-[hsl(var(--destructive))]">
                {errors.dueDate.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea
              {...register('notes')}
              rows={3}
              placeholder="Observaciones, instrucciones de pago…"
            />
          </div>
        </div>

        {create.error && (
          <p className="text-sm text-[hsl(var(--destructive))]">
            {create.error.message}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/cuentas-cobro')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={create.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {create.isPending ? 'Creando…' : 'Crear cuenta de cobro'}
          </Button>
        </div>
      </form>
    </div>
  );
}
