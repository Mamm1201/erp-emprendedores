import { Fragment, useState, type ReactNode } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Zap,
  XCircle,
  Trash2,
  CalendarClock,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Pencil,
} from 'lucide-react';

import { useMaintenancePlan, useSyncPlanVisits } from '@/hooks/use-maintenance-plans';
import {
  useMaintenanceVisits,
  useUpdateVisit,
  useGenerateWorkOrder,
  useCloseVisitWithoutExecution,
  useCancelVisit,
  useDeleteVisit,
  useMarkEquipmentNotAttended,
  useRevertEquipmentToPending,
  useSetEarlyExecutionNote,
} from '@/hooks/use-maintenance-visits';
import { useContractEquipment } from '@/hooks/use-contract-equipment';
import {
  usePlanEquipment,
  useAttachPlanEquipment,
  useDetachPlanEquipment,
} from '@/hooks/use-plan-equipment';
import { EquipmentAssociationPanel } from '@/components/maintenance/EquipmentAssociationPanel';
import type { MaintenanceVisit, NotAttendedReason, VisitEquipment } from '@/lib/types';
import {
  COMPLIANCE_BADGE,
  COMPLIANCE_LABELS,
  DEADLINE_BADGE,
  DEADLINE_LABELS,
  FREQUENCY_LABELS,
  NOT_ATTENDED_REASON_LABELS,
  VISIT_EQUIPMENT_STATUS_BADGE,
  VISIT_EQUIPMENT_STATUS_LABELS,
  VISIT_STATUS_BADGE,
  VISIT_STATUS_LABELS,
  fmtCalendarDate,
  fmtInstantDate,
  periodLabel,
} from '@/lib/maintenance';
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

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]';

function isOpen(visit: MaintenanceVisit) {
  return visit.status === 'PENDING' || visit.status === 'IN_PROGRESS';
}

// Atendido antes del periodo (fecha local de la intervencion < periodStart).
function isEarly(visit: Pick<MaintenanceVisit, 'periodStart'>, item: VisitEquipment) {
  return (
    item.intervention !== null &&
    format(new Date(item.intervention.occurredAt), 'yyyy-MM-dd') < visit.periodStart.slice(0, 10)
  );
}

function equipmentLabel(item: VisitEquipment) {
  const e = item.equipment;
  return `${e.type.replace(/_/g, ' ')} — ${e.brand ?? ''} ${e.model ?? ''}`.trim() +
    (e.serialNumber ? ` · S/N ${e.serialNumber}` : '') +
    (e.location ? ` (${e.location})` : '');
}

// ─── Dialogo de texto obligatorio (motivo / justificacion) ───────────────────

function TextPromptDialog({
  title,
  description,
  label,
  confirmLabel,
  isPending,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  description?: ReactNode;
  label: string;
  confirmLabel: string;
  isPending: boolean;
  onConfirm: (text: string) => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const [text, setText] = useState('');
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {children}
          <div className="space-y-1">
            <Label htmlFor="prompt-text">{label} *</Label>
            <Textarea id="prompt-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Volver</Button>
          </DialogClose>
          <Button disabled={isPending || !text.trim()} onClick={() => onConfirm(text.trim())}>
            {isPending ? 'Guardando…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Equipos de la visita ─────────────────────────────────────────────────────

function VisitEquipmentPanel({ planId, visit }: { planId: string; visit: MaintenanceVisit }) {
  const markNotAttended = useMarkEquipmentNotAttended(planId);
  const revert = useRevertEquipmentToPending(planId);
  const setEarlyNote = useSetEarlyExecutionNote(planId);

  const [notAttendedItem, setNotAttendedItem] = useState<VisitEquipment | null>(null);
  const [reason, setReason] = useState<NotAttendedReason>('IN_USE');
  const [earlyItem, setEarlyItem] = useState<VisitEquipment | null>(null);

  const open = isOpen(visit);

  return (
    <div className="px-4 py-3 bg-muted/20 space-y-2">
      <p className="text-xs text-muted-foreground">
        Ventana válida: {fmtCalendarDate(visit.periodStart)} – {fmtCalendarDate(visit.periodEnd)}.
        Los equipos se atienden desde la OT de la visita (acta); aquí se registran los no atendidos.
      </p>
      <ul className="divide-y rounded-md border bg-[hsl(var(--background))]">
        {visit.equipment.map((item) => {
          const early = item.origin === 'SCHEDULED' && isEarly(visit, item);
          return (
            <li key={item.id} className="px-3 py-2 flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium truncate">
                  {equipmentLabel(item)}
                  {item.origin === 'ADDED' && (
                    <Badge variant="secondary" className="ml-2 text-xs">No programado</Badge>
                  )}
                </p>
                {item.intervention && (
                  <p className="text-xs text-muted-foreground">
                    Atendido el {fmtInstantDate(item.intervention.occurredAt)}
                    {early && ' · anticipado'}
                  </p>
                )}
                {early && (
                  <p className="text-xs">
                    {item.earlyExecutionNote
                      ? <>Justificación: <span className="text-muted-foreground">{item.earlyExecutionNote}</span></>
                      : <span className="text-amber-signal">Falta la justificación de ejecución anticipada.</span>}
                  </p>
                )}
                {item.status === 'NOT_ATTENDED' && item.notAttendedReason && (
                  <p className="text-xs text-muted-foreground">
                    {NOT_ATTENDED_REASON_LABELS[item.notAttendedReason]} — {item.notAttendedNote}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={VISIT_EQUIPMENT_STATUS_BADGE[item.status]}>
                  {VISIT_EQUIPMENT_STATUS_LABELS[item.status]}
                </Badge>
                {open && item.status === 'PENDING' && (
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setNotAttendedItem(item)}>
                    No atendido
                  </Button>
                )}
                {open && item.status === 'NOT_ATTENDED' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    disabled={revert.isPending}
                    onClick={() => revert.mutate({ visitId: visit.id, equipmentId: item.equipmentId })}
                  >
                    Revertir
                  </Button>
                )}
                {open && early && (
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEarlyItem(item)}>
                    Justificar
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {notAttendedItem && (
        <TextPromptDialog
          title="Equipo no atendido"
          description={equipmentLabel(notAttendedItem)}
          label="Nota"
          confirmLabel="Marcar no atendido"
          isPending={markNotAttended.isPending}
          onClose={() => setNotAttendedItem(null)}
          onConfirm={async (note) => {
            await markNotAttended.mutateAsync({
              visitId: visit.id,
              equipmentId: notAttendedItem.equipmentId,
              reason,
              note,
            });
            setNotAttendedItem(null);
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="reason">Motivo *</Label>
            <select
              id="reason"
              className={SELECT_CLASS}
              value={reason}
              onChange={(e) => setReason(e.target.value as NotAttendedReason)}
            >
              {Object.entries(NOT_ATTENDED_REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </TextPromptDialog>
      )}

      {earlyItem && (
        <TextPromptDialog
          title="Justificar ejecución anticipada"
          description={`${equipmentLabel(earlyItem)} se atendió antes del período de la visita.`}
          label="Justificación"
          confirmLabel="Guardar"
          isPending={setEarlyNote.isPending}
          onClose={() => setEarlyItem(null)}
          onConfirm={async (note) => {
            await setEarlyNote.mutateAsync({ visitId: visit.id, equipmentId: earlyItem.equipmentId, note });
            setEarlyItem(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MaintenancePlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<MaintenanceVisit | null>(null);
  const [newDate, setNewDate] = useState('');
  const [confirmClose, setConfirmClose] = useState<MaintenanceVisit | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<MaintenanceVisit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MaintenanceVisit | null>(null);

  const { data: plan } = useMaintenancePlan(planId ?? null);

  const { data: visitsData, isLoading } = useMaintenanceVisits(planId ?? '');
  const visits = visitsData?.data ?? [];

  const syncVisits = useSyncPlanVisits(planId ?? '');
  const updateVisit = useUpdateVisit(planId ?? '');
  const generateWO = useGenerateWorkOrder(planId ?? '');
  const closeVisit = useCloseVisitWithoutExecution(planId ?? '');
  const cancelVisit = useCancelVisit(planId ?? '');
  const deleteVisit = useDeleteVisit(planId ?? '');

  const contractId = plan?.contract.id ?? null;
  const { data: contractEquipment = [], isLoading: isLoadingContractEquipment } =
    useContractEquipment(contractId);
  const { data: planEquipment = [], isLoading: isLoadingPlanEquipment } =
    usePlanEquipment(planId ?? null);
  const attachPlanEquipment = useAttachPlanEquipment(planId ?? '');
  const detachPlanEquipment = useDetachPlanEquipment(planId ?? '');

  // R1: solo equipos del contrato que pertenecen a la sede del plan.
  const planEquipmentIds = new Set(planEquipment.map((e) => e.equipmentId));
  const availablePlanEquipment = contractEquipment
    .filter((e) => !planEquipmentIds.has(e.equipmentId))
    .filter((e) => !plan || e.equipment.branchId === plan.branchId)
    .map((e) => e.equipment);

  async function handleGenerate(visit: MaintenanceVisit) {
    const result = await generateWO.mutateAsync(visit.id);
    if (result.workOrder) {
      navigate(`/ordenes/${result.workOrder.id}`);
    }
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

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-[hsl(var(--primary))]" />
              {plan ? `Plan — Sede ${plan.branch.name}` : 'Plan de mantenimiento'}
            </h1>
            {plan && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {plan.contract.client.tradeName ?? plan.contract.client.legalName}
                {' · Contrato '}{plan.contract.number}
                {' · '}{FREQUENCY_LABELS[plan.frequency]}
                {' · Ciclo desde '}{periodLabel(plan.firstPeriodStart)}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            disabled={syncVisits.isPending || !plan?.isActive}
            onClick={() => syncVisits.mutate()}
            title="Genera las visitas faltantes de los períodos del contrato"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generar visitas
          </Button>
        </div>
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
          emptyAvailableMessage="No hay equipos de esta sede en el contrato — asócialos primero al contrato"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Los cambios de equipos aplican a las visitas que aún no empiezan su período.
        </p>
      </div>

      {/* Visits table */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Período</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha tentativa</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Equipos</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">OT</th>
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
                  No hay visitas para este plan. Usa “Generar visitas”.
                </td>
              </tr>
            )}
            {visits.map((v) => {
              const scheduled = v.equipment.filter((e) => e.origin === 'SCHEDULED');
              const attended = scheduled.filter((e) => e.status === 'ATTENDED').length;
              const isExpanded = expanded === v.id;
              const canCloseOrCancel = v.status === 'PENDING' && !v.workOrder;
              return (
                <Fragment key={v.id}>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium capitalize">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => setExpanded(isExpanded ? null : v.id)}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {periodLabel(v.periodStart)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {fmtCalendarDate(v.scheduledDate)}
                      {isOpen(v) && (
                        <button
                          type="button"
                          className="ml-1 align-middle text-muted-foreground hover:text-foreground"
                          title="Cambiar fecha tentativa"
                          onClick={() => { setEditDate(v); setNewDate(v.scheduledDate.slice(0, 10)); }}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 space-x-1">
                      <Badge variant={VISIT_STATUS_BADGE[v.status]}>{VISIT_STATUS_LABELS[v.status]}</Badge>
                      {v.deadline && (
                        <Badge variant={DEADLINE_BADGE[v.deadline]}>{DEADLINE_LABELS[v.deadline]}</Badge>
                      )}
                      {v.compliance && (
                        <Badge variant={COMPLIANCE_BADGE[v.compliance]}>{COMPLIANCE_LABELS[v.compliance]}</Badge>
                      )}
                      {v.status === 'CLOSED' && !v.compliance && (
                        <Badge variant="secondary" title="Visita anterior al modelo por sede">Legado</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {scheduled.length > 0 ? `${attended} de ${scheduled.length} atendidos` : '—'}
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {v.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            disabled={generateWO.isPending}
                            onClick={() => handleGenerate(v)}
                            title="Generar la OT de la visita (una por sede)"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Generar OT
                          </Button>
                        )}
                        {canCloseOrCancel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Cerrar sin ejecución (todos los equipos no atendidos)"
                            className="text-muted-foreground"
                            onClick={() => setConfirmClose(v)}
                          >
                            <CheckSquare className="h-4 w-4" />
                          </Button>
                        )}
                        {canCloseOrCancel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Cancelar la obligación (contrato terminado o plan desactivado)"
                            className="text-muted-foreground"
                            onClick={() => setConfirmCancel(v)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {canCloseOrCancel && (
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
                  {isExpanded && planId && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <VisitEquipmentPanel planId={planId} visit={v} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {editDate && (
        <Dialog open onOpenChange={(o) => { if (!o) setEditDate(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Fecha tentativa</DialogTitle></DialogHeader>
            <div className="space-y-2 py-2">
              <p className="text-sm text-muted-foreground">
                Solo sirve para planificar: no cambia el período ni el cumplimiento.
              </p>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              {newDate &&
                (newDate < editDate.periodStart.slice(0, 10) || newDate > editDate.periodEnd.slice(0, 10)) && (
                  <p className="text-xs text-amber-signal">
                    La fecha está fuera del período ({fmtCalendarDate(editDate.periodStart)} – {fmtCalendarDate(editDate.periodEnd)}).
                  </p>
                )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setEditDate(null)}>Volver</Button>
              </DialogClose>
              <Button
                disabled={updateVisit.isPending || !newDate}
                onClick={async () => {
                  await updateVisit.mutateAsync({ visitId: editDate.id, data: { scheduledDate: newDate } });
                  setEditDate(null);
                }}
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {confirmClose && (
        <Dialog open onOpenChange={(o) => { if (!o) setConfirmClose(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Cerrar sin ejecución</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              La visita de <strong className="capitalize">{periodLabel(confirmClose.periodStart)}</strong> quedará
              cerrada como <strong>incumplida</strong>. Todos sus equipos deben estar marcados como no atendidos con motivo.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setConfirmClose(null)}>Volver</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={closeVisit.isPending}
                onClick={async () => {
                  await closeVisit.mutateAsync(confirmClose.id);
                  setConfirmClose(null);
                }}
              >
                {closeVisit.isPending ? 'Cerrando…' : 'Cerrar visita'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {confirmCancel && (
        <TextPromptDialog
          title="Cancelar visita"
          description={
            <>
              Cancelar significa que la obligación de <strong className="capitalize">{periodLabel(confirmCancel.periodStart)}</strong>{' '}
              ya no existe (contrato terminado o plan desactivado). Para una visita que no se ejecutó, usa “Cerrar sin ejecución”.
            </>
          }
          label="Motivo"
          confirmLabel="Cancelar visita"
          isPending={cancelVisit.isPending}
          onClose={() => setConfirmCancel(null)}
          onConfirm={async (reason) => {
            await cancelVisit.mutateAsync({ visitId: confirmCancel.id, reason });
            setConfirmCancel(null);
          }}
        />
      )}

      {confirmDelete && (
        <Dialog open onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Eliminar visita</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              ¿Eliminar permanentemente la visita de <strong className="capitalize">{periodLabel(confirmDelete.periodStart)}</strong>?
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={deleteVisit.isPending}
                onClick={async () => {
                  await deleteVisit.mutateAsync(confirmDelete.id);
                  setConfirmDelete(null);
                }}
              >
                {deleteVisit.isPending ? 'Eliminando…' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
