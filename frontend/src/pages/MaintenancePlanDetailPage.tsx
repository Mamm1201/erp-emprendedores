import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Plus,
  Zap,
  XCircle,
  Trash2,
  CalendarClock,
  ExternalLink,
} from 'lucide-react';

import { useMaintenancePlans } from '@/hooks/use-maintenance-plans';
import {
  useMaintenanceVisits,
  useCreateMaintenanceVisit,
  useGenerateWorkOrder,
  useCancelVisit,
  useDeleteVisit,
  type VisitFormData,
} from '@/hooks/use-maintenance-visits';
import {
  useContractEquipment,
  useAttachContractEquipment,
  useDetachContractEquipment,
} from '@/hooks/use-contract-equipment';
import {
  usePlanEquipment,
  useAttachPlanEquipment,
  useDetachPlanEquipment,
} from '@/hooks/use-plan-equipment';
import { EquipmentAssociationPanel } from '@/components/maintenance/EquipmentAssociationPanel';
import type { MaintenanceVisit, MaintenanceVisitStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<MaintenanceVisitStatus, string> = {
  PENDING: 'Pendiente',
  GENERATED: 'OT generada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const STATUS_BADGE: Record<MaintenanceVisitStatus, 'secondary' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  GENERATED: 'info' as any,
  COMPLETED: 'success',
  CANCELLED: 'secondary',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return format(parseISO(iso.slice(0, 10)), "d 'de' MMM yyyy", { locale: es });
  } catch {
    return iso;
  }
}

function isOverdue(visit: MaintenanceVisit) {
  return visit.status === 'PENDING' && isPast(parseISO(visit.scheduledDate.slice(0, 10)));
}

// ─── New Visit Modal ──────────────────────────────────────────────────────────

const visitSchema = z.object({
  scheduledDate: z.string().min(1, 'La fecha programada es obligatoria'),
  windowEnd: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});
type VisitSchema = z.infer<typeof visitSchema>;

function NewVisitModal({ planId, onClose }: { planId: string; onClose: () => void }) {
  const createVisit = useCreateMaintenanceVisit(planId);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VisitSchema>({
    resolver: zodResolver(visitSchema),
  });

  async function onSubmit(values: VisitSchema) {
    const data: VisitFormData = {
      scheduledDate: values.scheduledDate,
      windowEnd: values.windowEnd || undefined,
      notes: values.notes || undefined,
    };
    await createVisit.mutateAsync(data);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Programar visita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="scheduledDate">Fecha programada *</Label>
            <Input id="scheduledDate" type="date" {...register('scheduledDate')} />
            {errors.scheduledDate && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.scheduledDate.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="windowEnd">Fecha límite (ventana)</Label>
            <Input id="windowEnd" type="date" {...register('windowEnd')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" rows={2} placeholder="Observaciones…" {...register('notes')} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Programar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MaintenancePlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [showNewVisit, setShowNewVisit] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<MaintenanceVisit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MaintenanceVisit | null>(null);

  const { data: plansData } = useMaintenancePlans({});
  const plan = plansData?.data.find((p) => p.id === planId);

  const { data: visitsData, isLoading } = useMaintenanceVisits(planId ?? '');
  const visits = visitsData?.data ?? [];

  const generateWO = useGenerateWorkOrder(planId ?? '');
  const cancelVisit = useCancelVisit(planId ?? '');
  const deleteVisit = useDeleteVisit(planId ?? '');

  const contractId = plan?.contract.id ?? null;
  const { data: contractEquipment = [], isLoading: isLoadingContractEquipment } =
    useContractEquipment(contractId);
  const { data: planEquipment = [], isLoading: isLoadingPlanEquipment } =
    usePlanEquipment(planId ?? null);
  const attachPlanEquipment = useAttachPlanEquipment(planId ?? '');
  const detachPlanEquipment = useDetachPlanEquipment(planId ?? '');

  const planEquipmentIds = new Set(planEquipment.map((e) => e.equipmentId));
  const availablePlanEquipment = contractEquipment
    .filter((e) => !planEquipmentIds.has(e.equipmentId))
    .map((e) => e.equipment);

  async function handleGenerate(visit: MaintenanceVisit) {
    const result = await generateWO.mutateAsync(visit.id);
    if (result.workOrder) {
      navigate(`/ordenes/${result.workOrder.id}`);
    }
  }

  async function handleCancel() {
    if (!confirmCancel) return;
    await cancelVisit.mutateAsync(confirmCancel.id);
    setConfirmCancel(null);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    await deleteVisit.mutateAsync(confirmDelete.id);
    setConfirmDelete(null);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back nav */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link to="/planes">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Planes de mantenimiento
          </Link>
        </Button>

        {plan ? (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-[hsl(var(--primary))]" />
                Plan — {plan.contract.number}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {plan.contract.client.tradeName ?? plan.contract.client.legalName}
                {' · '}
                {plan.frequency === 'MONTHLY' ? 'Mensual' :
                  plan.frequency === 'QUARTERLY' ? 'Trimestral' :
                  plan.frequency === 'EVERY_4_MONTHS' ? 'Cuatrimestral' :
                  plan.frequency === 'BIANNUAL' ? 'Semestral' : 'Anual'}
                {' · Inicio: '}
                {fmtDate(plan.startDate)}
              </p>
            </div>
            <Button onClick={() => setShowNewVisit(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Programar visita
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Plan de mantenimiento</h1>
            <Button onClick={() => setShowNewVisit(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Programar visita
            </Button>
          </div>
        )}
      </div>

      {/* Equipos del plan */}
      <div className="rounded-md border p-4">
        <EquipmentAssociationPanel
          title="Equipos cubiertos por este plan"
          associated={planEquipment}
          availableEquipment={availablePlanEquipment}
          isLoading={isLoadingPlanEquipment || isLoadingContractEquipment}
          isAttaching={attachPlanEquipment.isPending}
          isDetaching={detachPlanEquipment.isPending}
          onAttach={(equipmentId) => attachPlanEquipment.mutate(equipmentId)}
          onDetach={(equipmentId) => detachPlanEquipment.mutate(equipmentId)}
          emptyAvailableMessage="No hay equipos del contrato disponibles — asócialos primero al contrato"
        />
      </div>

      {/* Visits table */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha programada</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ventana fin</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">OT</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notas</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Cargando…</td>
              </tr>
            )}
            {!isLoading && visits.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No hay visitas programadas para este plan.
                </td>
              </tr>
            )}
            {visits.map((v) => {
              const overdue = isOverdue(v);
              return (
                <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <span className={overdue ? 'text-[hsl(var(--destructive))]' : ''}>
                      {fmtDate(v.scheduledDate)}
                    </span>
                    {overdue && (
                      <Badge variant="danger" className="ml-2 text-xs">Vencida</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {v.windowEnd ? fmtDate(v.windowEnd) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[v.status]}>{STATUS_LABELS[v.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {v.workOrder ? (
                      <Link
                        to={`/ordenes/${v.workOrder.id}`}
                        className="inline-flex items-center gap-1 text-xs font-mono text-[hsl(var(--primary))] hover:underline"
                      >
                        {v.workOrder.number}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                    {v.notes ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {v.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          disabled={generateWO.isPending}
                          onClick={() => handleGenerate(v)}
                          title="Generar Orden de Trabajo"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Generar OT
                        </Button>
                      )}
                      {(v.status === 'PENDING' || v.status === 'GENERATED') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Cancelar visita"
                          className="text-muted-foreground"
                          onClick={() => setConfirmCancel(v)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {v.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Eliminar visita"
                          className="text-[hsl(var(--destructive))]"
                          onClick={() => setConfirmDelete(v)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showNewVisit && planId && (
        <NewVisitModal planId={planId} onClose={() => setShowNewVisit(false)} />
      )}

      {confirmCancel && (
        <Dialog open onOpenChange={(v) => { if (!v) setConfirmCancel(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Cancelar visita</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              ¿Cancelar la visita del <strong>{fmtDate(confirmCancel.scheduledDate)}</strong>?
              {confirmCancel.workOrder && (
                <span className="block mt-1 text-xs">
                  La OT <span className="font-mono">{confirmCancel.workOrder.number}</span> quedará desvinculada pero no será eliminada.
                </span>
              )}
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setConfirmCancel(null)}>Volver</Button>
              </DialogClose>
              <Button variant="destructive" disabled={cancelVisit.isPending} onClick={handleCancel}>
                {cancelVisit.isPending ? 'Cancelando…' : 'Cancelar visita'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {confirmDelete && (
        <Dialog open onOpenChange={(v) => { if (!v) setConfirmDelete(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Eliminar visita</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              ¿Eliminar permanentemente la visita del <strong>{fmtDate(confirmDelete.scheduledDate)}</strong>?
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              </DialogClose>
              <Button variant="destructive" disabled={deleteVisit.isPending} onClick={handleDelete}>
                {deleteVisit.isPending ? 'Eliminando…' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
