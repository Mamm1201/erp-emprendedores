import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';

import { useEquipment } from '@/hooks/use-equipment';
import { useTechnicians } from '@/hooks/use-users';
import { useCreateServiceRecord, type CreateServiceRecordData } from '@/hooks/use-service-records';
import type { WorkOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
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

const interventionSchema = z.object({
  equipmentId: z.string().min(1, 'Selecciona un equipo'),
  findings: z.string().max(4000).optional().or(z.literal('')),
  activitiesPerformed: z.string().max(4000).optional().or(z.literal('')),
  recommendations: z.string().max(4000).optional().or(z.literal('')),
  primaryTechnicianId: z.string().optional().or(z.literal('')),
});

const createSchema = z.object({
  interventions: z.array(interventionSchema),
  clientSignedAt: z.string().optional().or(z.literal('')),
});
type CreateSchema = z.infer<typeof createSchema>;

const DEFAULT_INTERVENTION = { equipmentId: '', findings: '', activitiesPerformed: '', recommendations: '', primaryTechnicianId: '' };

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]';

// Un equipo real de la sede — el tecnico elige aqui cuales de estos se
// intervinieron realmente. Estar en esta lista no crea nada por si solo:
// solo las filas que el tecnico agrega y envia generan una Intervention.
export function CreateServiceRecordModal({
  workOrder,
  onOpenChange,
}: {
  workOrder: WorkOrder | null;
  onOpenChange: (open: boolean) => void;
}) {
  const createRecord = useCreateServiceRecord();
  const { data: equipmentData } = useEquipment(
    workOrder?.clientId ?? null,
    workOrder?.branchId ?? null,
  );
  const equipmentList = equipmentData?.data ?? [];
  const { data: technicians = [] } = useTechnicians();

  const { register, control, handleSubmit, reset } = useForm<CreateSchema>({
    resolver: zodResolver(createSchema),
    defaultValues: { interventions: [], clientSignedAt: '' },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'interventions' });

  useEffect(() => {
    if (workOrder) reset({ interventions: [], clientSignedAt: '' });
  }, [workOrder, reset]);

  async function onSubmit(values: CreateSchema) {
    if (!workOrder) return;
    const data: CreateServiceRecordData = {
      interventions: values.interventions.map((iv) => ({
        equipmentId: iv.equipmentId,
        findings: iv.findings || undefined,
        activitiesPerformed: iv.activitiesPerformed || undefined,
        recommendations: iv.recommendations || undefined,
        primaryTechnicianId: iv.primaryTechnicianId || undefined,
      })),
      clientSignedAt: values.clientSignedAt || undefined,
    };
    await createRecord.mutateAsync({ workOrderId: workOrder.id, data });
    onOpenChange(false);
  }

  return (
    <Dialog open={!!workOrder} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear acta técnica</DialogTitle>
          {workOrder && (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {workOrder.number} — {workOrder.title}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Equipos intervenidos{' '}
                <span className="text-[hsl(var(--muted-foreground))] font-normal">(genera checklist automático por equipo)</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-7"
                onClick={() => append(DEFAULT_INTERVENTION)}
              >
                <Plus className="h-3 w-3" /> Agregar equipo
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] italic border rounded-md px-3 py-2">
                Sin equipos agregados — el acta se creará sin trazabilidad por activo.
              </p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="rounded-md border p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`interventions.${index}.equipmentId`}>Equipo</Label>
                    <select
                      id={`interventions.${index}.equipmentId`}
                      {...register(`interventions.${index}.equipmentId` as const)}
                      className={SELECT_CLASS}
                    >
                      <option value="">Selecciona un equipo…</option>
                      {equipmentList.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.type.replace(/_/g, ' ')} — {eq.brand ?? ''} {eq.model ?? ''}{eq.location ? ` (${eq.location})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6 text-[hsl(var(--destructive))] shrink-0"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`interventions.${index}.findings`}>Hallazgos</Label>
                  <Textarea
                    id={`interventions.${index}.findings`}
                    {...register(`interventions.${index}.findings` as const)}
                    rows={2}
                    placeholder="Descripción del estado encontrado…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`interventions.${index}.activitiesPerformed`}>Actividades realizadas</Label>
                  <Textarea
                    id={`interventions.${index}.activitiesPerformed`}
                    {...register(`interventions.${index}.activitiesPerformed` as const)}
                    rows={2}
                    placeholder="Trabajos ejecutados durante la visita…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`interventions.${index}.recommendations`}>Recomendaciones</Label>
                  <Textarea
                    id={`interventions.${index}.recommendations`}
                    {...register(`interventions.${index}.recommendations` as const)}
                    rows={2}
                    placeholder="Acciones correctivas o preventivas sugeridas…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`interventions.${index}.primaryTechnicianId`}>Técnico que intervino</Label>
                  <select
                    id={`interventions.${index}.primaryTechnicianId`}
                    {...register(`interventions.${index}.primaryTechnicianId` as const)}
                    className={SELECT_CLASS}
                  >
                    <option value="">Sin asignar</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Firma cliente */}
          <div className="space-y-1.5">
            <Label htmlFor="clientSignedAt">Fecha firma cliente</Label>
            <Input id="clientSignedAt" type="date" {...register('clientSignedAt')} className="max-w-xs" />
          </div>

          {createRecord.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{createRecord.error.message}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={createRecord.isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={createRecord.isPending}>
              {createRecord.isPending ? 'Creando…' : 'Crear acta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
