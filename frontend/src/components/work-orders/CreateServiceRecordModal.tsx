import { useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';

import { useEquipment } from '@/hooks/use-equipment';
import { useTechnicians } from '@/hooks/use-users';
import {
  useAddInterventions,
  useCreateServiceRecord,
  type CreateServiceRecordData,
  type InterventionInputData,
} from '@/hooks/use-service-records';
import type { EquipmentType, WorkOrder } from '@/lib/types';
import { fmtCalendarDate, todayIso } from '@/lib/maintenance';
import { EQUIPMENT_TYPE_OPTIONS } from '@/lib/work-order-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

const interventionSchema = z
  .object({
    // EXISTING: equipo ya registrado. NEW: equipo que nace con el Suministro.
    equipmentMode: z.enum(['EXISTING', 'NEW']),
    equipmentId: z.string().optional().or(z.literal('')),
    newType: z.string().optional().or(z.literal('')),
    newBrand: z.string().max(100).optional().or(z.literal('')),
    newModel: z.string().max(100).optional().or(z.literal('')),
    newSerial: z.string().max(100).optional().or(z.literal('')),
    newInstallDate: z.string().optional().or(z.literal('')),
    newWarranty: z.string().optional().or(z.literal('')),
    newNotes: z.string().max(2000).optional().or(z.literal('')),
    occurredAt: z.string().min(1, 'Indica la fecha real de atención'),
    findings: z.string().max(4000).optional().or(z.literal('')),
    activitiesPerformed: z.string().max(4000).optional().or(z.literal('')),
    recommendations: z.string().max(4000).optional().or(z.literal('')),
    primaryTechnicianId: z.string().optional().or(z.literal('')),
    earlyExecutionNote: z.string().max(2000).optional().or(z.literal('')),
  })
  .superRefine((row, ctx) => {
    if (row.equipmentMode === 'EXISTING' && !row.equipmentId) {
      ctx.addIssue({ code: 'custom', path: ['equipmentId'], message: 'Selecciona un equipo' });
    }
    if (row.equipmentMode === 'NEW' && !row.newType) {
      ctx.addIssue({ code: 'custom', path: ['newType'], message: 'Selecciona el tipo de equipo' });
    }
  });

const createSchema = z.object({
  interventions: z.array(interventionSchema),
  clientSignedAt: z.string().optional().or(z.literal('')),
});
type CreateSchema = z.infer<typeof createSchema>;
type InterventionRow = CreateSchema['interventions'][number];

function emptyRow(equipmentId = ''): InterventionRow {
  return {
    equipmentMode: 'EXISTING',
    equipmentId,
    newType: '',
    newBrand: '',
    newModel: '',
    newSerial: '',
    newInstallDate: '',
    newWarranty: '',
    newNotes: '',
    occurredAt: todayIso(),
    findings: '',
    activitiesPerformed: '',
    recommendations: '',
    primaryTechnicianId: '',
    earlyExecutionNote: '',
  };
}

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]';

// mode "create": crea el acta con sus intervenciones.
// mode "add": agrega intervenciones a un acta existente con la OT abierta
// (una visita puede ejecutarse en varias jornadas).
//
// Si la OT viene de una visita de mantenimiento, se precarga una fila por
// cada equipo programado aun pendiente. Solo las filas que se envian generan
// una Intervention: quita las de los equipos que no se atendieron en esta
// jornada (quedan pendientes en la visita).
//
// OT de Suministro (SUPPLY): cada fila puede usar un equipo existente de la
// sede (p. ej. un periferico incorporado) o registrar un equipo nuevo que nace
// con la entrega. Sin checklist de mantenimiento precargado.
export function CreateServiceRecordModal({
  workOrder,
  onOpenChange,
  mode = 'create',
}: {
  workOrder: WorkOrder | null;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'add';
}) {
  const createRecord = useCreateServiceRecord();
  const addInterventions = useAddInterventions();
  const mutation = mode === 'create' ? createRecord : addInterventions;

  const { data: equipmentData } = useEquipment(
    workOrder?.clientId ?? null,
    workOrder?.branchId ?? null,
  );
  const equipmentList = equipmentData?.data ?? [];
  const { data: technicians = [] } = useTechnicians();

  const isSupply = workOrder?.type === 'SUPPLY';
  const hasBranch = !!workOrder?.branchId;

  const visit = workOrder?.maintenanceVisit ?? null;
  const scheduledIds = new Set(
    (visit?.equipment ?? []).filter((e) => e.origin === 'SCHEDULED').map((e) => e.equipmentId),
  );

  const { register, control, handleSubmit, reset, setValue } = useForm<CreateSchema>({
    resolver: zodResolver(createSchema),
    defaultValues: { interventions: [], clientSignedAt: '' },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'interventions' });
  const rows = useWatch({ control, name: 'interventions' }) ?? [];

  useEffect(() => {
    if (!workOrder) return;
    const pending = (workOrder.maintenanceVisit?.equipment ?? [])
      .filter((e) => e.origin === 'SCHEDULED' && e.status === 'PENDING')
      .map((e) => emptyRow(e.equipmentId));
    reset({ interventions: pending, clientSignedAt: '' });
  }, [workOrder, reset]);

  // R7: programado atendido antes del periodo -> requiere justificacion.
  function isEarlyRow(row: InterventionRow | undefined) {
    return (
      !!visit && !!row && row.equipmentMode === 'EXISTING' && !!row.equipmentId &&
      scheduledIds.has(row.equipmentId) &&
      !!row.occurredAt && row.occurredAt < visit.periodStart.slice(0, 10)
    );
  }

  async function onSubmit(values: CreateSchema) {
    if (!workOrder) return;
    const interventions: InterventionInputData[] = values.interventions.map((iv) => ({
      ...(iv.equipmentMode === 'NEW'
        ? {
            newEquipment: {
              type: iv.newType as EquipmentType,
              brand: iv.newBrand || undefined,
              model: iv.newModel || undefined,
              serialNumber: iv.newSerial || undefined,
              // Fecha de entrega/puesta en servicio; por defecto, la fecha real.
              installDate: iv.newInstallDate || iv.occurredAt,
              warrantyExpiresAt: iv.newWarranty || undefined,
              notes: iv.newNotes || undefined,
            },
          }
        : { equipmentId: iv.equipmentId || undefined }),
      occurredAt: iv.occurredAt,
      findings: iv.findings || undefined,
      activitiesPerformed: iv.activitiesPerformed || undefined,
      recommendations: iv.recommendations || undefined,
      primaryTechnicianId: iv.primaryTechnicianId || undefined,
      earlyExecutionNote: isEarlyRow(iv) ? iv.earlyExecutionNote || undefined : undefined,
    }));

    if (mode === 'create') {
      const data: CreateServiceRecordData = {
        interventions,
        clientSignedAt: values.clientSignedAt || undefined,
      };
      await createRecord.mutateAsync({ workOrderId: workOrder.id, data });
    } else {
      await addInterventions.mutateAsync({ workOrderId: workOrder.id, interventions });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={!!workOrder} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Crear acta técnica' : 'Agregar intervenciones'}</DialogTitle>
          {workOrder && (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {workOrder.number} — {workOrder.title}
            </p>
          )}
          {visit && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Visita del período {fmtCalendarDate(visit.periodStart)} – {fmtCalendarDate(visit.periodEnd)}.
              Se precargan los equipos programados pendientes; quita los que no se atendieron en esta jornada.
            </p>
          )}
          {isSupply && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Suministro: por cada unidad entregada usa un equipo existente (p. ej. un periférico
              incorporado) o registra un equipo nuevo. Documenta qué se suministró o instaló y sobre qué equipo aplica.
            </p>
          )}
          {isSupply && !hasBranch && (
            <p className="text-xs text-[hsl(var(--destructive))]">
              Esta OT no tiene sede: asígnala antes de registrar equipos.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Equipos intervenidos{' '}
                <span className="text-[hsl(var(--muted-foreground))] font-normal">
                  {isSupply
                    ? '(sin checklist de mantenimiento)'
                    : '(genera checklist automático por equipo)'}
                </span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-7"
                onClick={() => append(emptyRow())}
              >
                <Plus className="h-3 w-3" /> Agregar equipo
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] italic border rounded-md px-3 py-2">
                {mode === 'create'
                  ? 'Sin equipos agregados — el acta se creará sin trazabilidad por activo.'
                  : 'Agrega al menos un equipo intervenido.'}
              </p>
            )}

            {fields.map((field, index) => {
              const row = rows[index];
              const isNew = row?.equipmentMode === 'NEW';
              const notScheduled =
                !!visit && !isNew && !!row?.equipmentId && !scheduledIds.has(row.equipmentId);
              return (
                <div key={field.id} className="rounded-md border p-3 space-y-3">
                  {isSupply && (
                    <div className="flex gap-1">
                      {(['EXISTING', 'NEW'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setValue(`interventions.${index}.equipmentMode`, m)}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                            row?.equipmentMode === m
                              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent'
                              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]',
                          )}
                        >
                          {m === 'EXISTING' ? 'Equipo existente' : 'Nuevo equipo'}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-1.5">
                      {isNew ? (
                        <>
                          <Label htmlFor={`interventions.${index}.newType`}>Tipo de equipo *</Label>
                          <select
                            id={`interventions.${index}.newType`}
                            {...register(`interventions.${index}.newType` as const)}
                            className={SELECT_CLASS}
                          >
                            <option value="">Selecciona el tipo…</option>
                            {EQUIPMENT_TYPE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <>
                          <Label htmlFor={`interventions.${index}.equipmentId`}>Equipo</Label>
                          <select
                            id={`interventions.${index}.equipmentId`}
                            {...register(`interventions.${index}.equipmentId` as const)}
                            className={SELECT_CLASS}
                          >
                            <option value="">Selecciona un equipo…</option>
                            {equipmentList.map((eq) => (
                              <option key={eq.id} value={eq.id}>
                                {eq.type.replace(/_/g, ' ')} — {eq.brand ?? ''} {eq.model ?? ''}
                                {eq.serialNumber ? ` · S/N ${eq.serialNumber}` : ''}
                                {eq.location ? ` (${eq.location})` : ''}
                              </option>
                            ))}
                          </select>
                          {notScheduled && (
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                              Equipo no programado en la visita: queda en su historial y no afecta el cumplimiento.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="w-40 space-y-1.5">
                      <Label htmlFor={`interventions.${index}.occurredAt`}>Fecha real</Label>
                      <Input
                        id={`interventions.${index}.occurredAt`}
                        type="date"
                        max={todayIso()}
                        {...register(`interventions.${index}.occurredAt` as const)}
                      />
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

                  {isNew && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor={`interventions.${index}.newBrand`}>Marca</Label>
                        <Input id={`interventions.${index}.newBrand`} {...register(`interventions.${index}.newBrand` as const)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`interventions.${index}.newModel`}>Modelo</Label>
                        <Input id={`interventions.${index}.newModel`} {...register(`interventions.${index}.newModel` as const)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`interventions.${index}.newSerial`}>Serial</Label>
                        <Input id={`interventions.${index}.newSerial`} {...register(`interventions.${index}.newSerial` as const)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`interventions.${index}.newInstallDate`}>Fecha de entrega</Label>
                        <Input
                          id={`interventions.${index}.newInstallDate`}
                          type="date"
                          max={todayIso()}
                          {...register(`interventions.${index}.newInstallDate` as const)}
                        />
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Vacía: se usa la fecha real.</p>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`interventions.${index}.newWarranty`}>Vence garantía</Label>
                        <Input
                          id={`interventions.${index}.newWarranty`}
                          type="date"
                          {...register(`interventions.${index}.newWarranty` as const)}
                        />
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Opcional.</p>
                      </div>
                      <div className="space-y-1 sm:col-span-3">
                        <Label htmlFor={`interventions.${index}.newNotes`}>Observaciones del equipo</Label>
                        <Textarea
                          id={`interventions.${index}.newNotes`}
                          rows={2}
                          placeholder="Accesorios incluidos, periféricos del módulo, ubicación…"
                          {...register(`interventions.${index}.newNotes` as const)}
                        />
                      </div>
                    </div>
                  )}

                  {isEarlyRow(row) && (
                    <div className="space-y-1.5">
                      <Label htmlFor={`interventions.${index}.earlyExecutionNote`}>
                        Justificación de ejecución anticipada *
                      </Label>
                      <Textarea
                        id={`interventions.${index}.earlyExecutionNote`}
                        {...register(`interventions.${index}.earlyExecutionNote` as const)}
                        rows={2}
                        placeholder="Por qué se atendió antes del período…"
                      />
                    </div>
                  )}

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
                      placeholder={
                        isSupply
                          ? 'Qué se suministró o instaló y sobre qué equipo aplica…'
                          : 'Trabajos ejecutados durante la visita…'
                      }
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
              );
            })}
          </div>

          {/* Firma cliente */}
          {mode === 'create' && (
            <div className="space-y-1.5">
              <Label htmlFor="clientSignedAt">Fecha firma cliente</Label>
              <Input id="clientSignedAt" type="date" {...register('clientSignedAt')} className="max-w-xs" />
            </div>
          )}

          {mutation.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{mutation.error.message}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={mutation.isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending || (mode === 'add' && fields.length === 0)}>
              {mutation.isPending
                ? 'Guardando…'
                : mode === 'create' ? 'Crear acta' : 'Agregar intervenciones'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
