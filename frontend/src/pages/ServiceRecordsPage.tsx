import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ClipboardCheck,
  Plus,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Search,
  FileDown,
} from 'lucide-react';

import { getApiToken } from '@/lib/api';

import { useWorkOrders } from '@/hooks/use-work-orders';
import { useEquipment } from '@/hooks/use-equipment';
import {
  useServiceRecord,
  useCreateServiceRecord,
  useUpdateServiceRecord,
  useUpdateChecklistItem,
  type CreateServiceRecordData,
  type UpdateServiceRecordData,
} from '@/hooks/use-service-records';
import type { WorkOrder, ChecklistResult, ChecklistItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const STATUS_BADGE: Record<string, 'secondary' | 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'secondary',
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const RESULT_CONFIG: Record<
  ChecklistResult,
  { label: string; icon: React.ElementType; class: string; activeClass: string }
> = {
  OK: {
    label: 'OK',
    icon: CheckCircle2,
    class: 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-node-teal/50 hover:text-node-teal',
    activeClass: 'border-node-teal bg-node-teal/10 text-node-teal',
  },
  WARNING: {
    label: 'Alerta',
    icon: AlertTriangle,
    class: 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-amber-signal/50 hover:text-amber-signal',
    activeClass: 'border-amber-signal bg-amber-signal/10 text-amber-signal',
  },
  FAIL: {
    label: 'Falla',
    icon: XCircle,
    class: 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-alert-red/50 hover:text-alert-red',
    activeClass: 'border-alert-red bg-alert-red/10 text-alert-red',
  },
  NA: {
    label: 'N/A',
    icon: MinusCircle,
    class: 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
    activeClass: 'border-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]',
  },
};

const RESULT_ORDER: ChecklistResult[] = ['OK', 'WARNING', 'FAIL', 'NA'];

// ─── PDF del acta ─────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function downloadServiceRecordPdf(workOrderId: string, workOrderNumber: string) {
  const token = getApiToken();
  const res = await fetch(`${BASE_URL}/documents/work-orders/${workOrderId}/service-record/pdf`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    alert('No se pudo generar el PDF del acta. Inténtalo de nuevo.');
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `acta-tecnica-${workOrderNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── ChecklistRow ─────────────────────────────────────────────────────────────

function ChecklistRow({
  item,
  workOrderId,
}: {
  item: ChecklistItem;
  workOrderId: string;
}) {
  const updateItem = useUpdateChecklistItem();
  const [notes, setNotes] = useState(item.notes ?? '');
  const [editingNotes, setEditingNotes] = useState(false);

  function handleResult(result: ChecklistResult) {
    if (result === item.result) return;
    updateItem.mutate({ workOrderId, itemId: item.id, result });
  }

  function handleNotesSave() {
    if (notes !== (item.notes ?? '')) {
      updateItem.mutate({ workOrderId, itemId: item.id, notes });
    }
    setEditingNotes(false);
  }

  return (
    <div className="py-3 border-b last:border-0">
      <div className="flex items-start gap-3">
        {/* Description */}
        <p className="flex-1 text-sm pt-0.5">{item.description}</p>

        {/* Result buttons */}
        <div className="flex gap-1 shrink-0">
          {RESULT_ORDER.map((r) => {
            const cfg = RESULT_CONFIG[r];
            const Icon = cfg.icon;
            const isActive = item.result === r;
            return (
              <button
                key={r}
                onClick={() => handleResult(r)}
                disabled={updateItem.isPending}
                title={cfg.label}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium transition-all',
                  isActive ? cfg.activeClass : cfg.class,
                  updateItem.isPending && 'opacity-50 cursor-not-allowed',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-1.5 ml-0">
        {editingNotes ? (
          <div className="flex gap-2 items-end">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observación…"
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleNotesSave()}
            />
            <Button size="sm" className="h-7 text-xs" onClick={handleNotesSave}>
              Guardar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => { setNotes(item.notes ?? ''); setEditingNotes(false); }}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            {item.notes ? item.notes : '+ Agregar observación'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  equipmentId: z.string().optional(),
  findings: z.string().max(4000).optional().or(z.literal('')),
  activitiesPerformed: z.string().max(4000).optional().or(z.literal('')),
  recommendations: z.string().max(4000).optional().or(z.literal('')),
  clientSignedAt: z.string().optional().or(z.literal('')),
});
type CreateSchema = z.infer<typeof createSchema>;

const updateSchema = z.object({
  findings: z.string().max(4000).optional().or(z.literal('')),
  activitiesPerformed: z.string().max(4000).optional().or(z.literal('')),
  recommendations: z.string().max(4000).optional().or(z.literal('')),
  clientSignedAt: z.string().optional().or(z.literal('')),
});
type UpdateSchema = z.infer<typeof updateSchema>;

// ─── CreateServiceRecordModal ─────────────────────────────────────────────────

function CreateServiceRecordModal({
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

  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: { equipmentId: '', findings: '', activitiesPerformed: '', recommendations: '', clientSignedAt: '' },
  });

  useEffect(() => {
    if (workOrder) reset({ equipmentId: '', findings: '', activitiesPerformed: '', recommendations: '', clientSignedAt: '' });
  }, [workOrder, reset]);

  async function onSubmit(values: CreateSchema) {
    if (!workOrder) return;
    const data: CreateServiceRecordData = {
      equipmentId: values.equipmentId || undefined,
      findings: values.findings || undefined,
      activitiesPerformed: values.activitiesPerformed || undefined,
      recommendations: values.recommendations || undefined,
      clientSignedAt: values.clientSignedAt || undefined,
    };
    await createRecord.mutateAsync({ workOrderId: workOrder.id, data });
    onOpenChange(false);
  }

  const SELECT_CLASS =
    'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]';

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
          {/* Equipo (opcional) */}
          <div className="space-y-1.5">
            <Label htmlFor="equipmentId">
              Equipo intervenido{' '}
              <span className="text-[hsl(var(--muted-foreground))] font-normal">(genera checklist automático)</span>
            </Label>
            <select id="equipmentId" {...register('equipmentId')} className={SELECT_CLASS}>
              <option value="">Sin equipo específico</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.type.replace(/_/g, ' ')} — {eq.brand ?? ''} {eq.model ?? ''}{eq.location ? ` (${eq.location})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Hallazgos */}
          <div className="space-y-1.5">
            <Label htmlFor="findings">Hallazgos</Label>
            <Textarea id="findings" {...register('findings')} rows={3} placeholder="Descripción del estado encontrado en el equipo o instalación…" />
          </div>

          {/* Actividades realizadas */}
          <div className="space-y-1.5">
            <Label htmlFor="activitiesPerformed">Actividades realizadas</Label>
            <Textarea id="activitiesPerformed" {...register('activitiesPerformed')} rows={3} placeholder="Detalle de los trabajos ejecutados durante la visita…" />
          </div>

          {/* Recomendaciones */}
          <div className="space-y-1.5">
            <Label htmlFor="recommendations">Recomendaciones</Label>
            <Textarea id="recommendations" {...register('recommendations')} rows={2} placeholder="Acciones correctivas o preventivas sugeridas…" />
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

// ─── ViewServiceRecordModal ───────────────────────────────────────────────────

function ViewServiceRecordModal({
  workOrder,
  onOpenChange,
}: {
  workOrder: WorkOrder | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: record, isLoading } = useServiceRecord(workOrder?.id ?? null);
  const updateRecord = useUpdateServiceRecord();

  const { register, handleSubmit, reset } = useForm<UpdateSchema>({
    resolver: zodResolver(updateSchema),
  });

  useEffect(() => {
    if (record) {
      reset({
        findings: record.findings ?? '',
        activitiesPerformed: record.activitiesPerformed ?? '',
        recommendations: record.recommendations ?? '',
        clientSignedAt: record.clientSignedAt ? record.clientSignedAt.slice(0, 10) : '',
      });
    }
  }, [record, reset]);

  async function onSubmit(values: UpdateSchema) {
    if (!workOrder) return;
    const data: UpdateServiceRecordData = {
      findings: values.findings || undefined,
      activitiesPerformed: values.activitiesPerformed || undefined,
      recommendations: values.recommendations || undefined,
      clientSignedAt: values.clientSignedAt || undefined,
    };
    await updateRecord.mutateAsync({ workOrderId: workOrder.id, data });
  }

  const allOk = record?.checklistItems.every((i) => i.result === 'OK');
  const hasWarning = record?.checklistItems.some((i) => i.result === 'WARNING');
  const hasFail = record?.checklistItems.some((i) => i.result === 'FAIL');
  const checklistSummaryVariant = hasFail ? 'danger' : hasWarning ? 'warning' : allOk ? 'success' : 'secondary';
  const checklistSummaryLabel = hasFail ? 'Con fallas' : hasWarning ? 'Con alertas' : allOk ? 'Todo OK' : 'Sin evaluar';

  return (
    <Dialog open={!!workOrder} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle>Acta técnica</DialogTitle>
              {workOrder && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                  {workOrder.number} — {workOrder.title}
                  <span className="ml-2">·</span>
                  <span className="ml-2">{workOrder.client.tradeName ?? workOrder.client.legalName}</span>
                  {workOrder.branch && (
                    <span className="ml-1 text-xs">/ {workOrder.branch.name}</span>
                  )}
                </p>
              )}
            </div>
            {record && (
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={checklistSummaryVariant}>
                  {checklistSummaryLabel}
                </Badge>
                {workOrder && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => downloadServiceRecordPdf(workOrder.id, workOrder.number)}
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Descargar PDF
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="py-10 text-center text-[hsl(var(--muted-foreground))] text-sm">
            Cargando acta…
          </div>
        )}

        {record && (
          <div className="space-y-6">
            {/* Narrativa */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label>Hallazgos</Label>
                  <Textarea {...register('findings')} rows={3} placeholder="Estado encontrado…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Actividades realizadas</Label>
                  <Textarea {...register('activitiesPerformed')} rows={3} placeholder="Trabajos ejecutados…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Recomendaciones</Label>
                  <Textarea {...register('recommendations')} rows={2} placeholder="Acciones sugeridas…" />
                </div>
                <div className="flex items-end gap-4">
                  <div className="space-y-1.5">
                    <Label>Fecha firma cliente</Label>
                    <Input type="date" {...register('clientSignedAt')} className="max-w-xs" />
                  </div>
                  <Button type="submit" variant="outline" size="sm" disabled={updateRecord.isPending} className="mb-0.5">
                    {updateRecord.isPending ? 'Guardando…' : 'Guardar narrativa'}
                  </Button>
                </div>
              </div>
            </form>

            {/* Checklist */}
            {record.checklistItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">
                    Checklist de verificación
                    <span className="ml-2 text-[hsl(var(--muted-foreground))] font-normal">
                      ({record.checklistItems.length} ítems)
                    </span>
                  </h3>
                  <div className="flex gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    {(['OK', 'WARNING', 'FAIL'] as ChecklistResult[]).map((r) => {
                      const count = record.checklistItems.filter((i) => i.result === r).length;
                      if (count === 0) return null;
                      const cfg = RESULT_CONFIG[r];
                      const Icon = cfg.icon;
                      return (
                        <span key={r} className={cn('flex items-center gap-1', cfg.activeClass, 'px-1.5 py-0.5 rounded border text-xs')}>
                          <Icon className="h-3 w-3" /> {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="border rounded-md px-4">
                  {record.checklistItems.map((item) => (
                    <ChecklistRow key={item.id} item={item} workOrderId={workOrder!.id} />
                  ))}
                </div>
              </div>
            )}

            {record.checklistItems.length === 0 && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] italic">
                Sin checklist — el acta no tiene equipo asociado o fue creada sin ítems.
              </p>
            )}

            {/* Meta */}
            <div className="text-xs text-[hsl(var(--muted-foreground))] border-t pt-3">
              Creada el {format(parseISO(record.createdAt), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
              {record.clientSignedAt && (
                <span className="ml-3">
                  · Firmada por el cliente el{' '}
                  {format(parseISO(record.clientSignedAt), "d 'de' MMMM yyyy", { locale: es })}
                </span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── ServiceRecordsPage ───────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'SCHEDULED', label: 'Programadas' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completadas' },
] as const;

export function ServiceRecordsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('IN_PROGRESS');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState<WorkOrder | null>(null);
  const [viewing, setViewing] = useState<WorkOrder | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useWorkOrders({
    search,
    status: statusFilter as any,
    page,
  });

  const workOrders = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Actas técnicas</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Registro de visitas y checklist de verificación
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                statusFilter === value
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            className="pl-8"
            placeholder="Buscar número o título…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[hsl(var(--muted)/0.4)]">
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">N° OT</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Título / Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell whitespace-nowrap">Fecha programada</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Estado OT</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Acta</th>
              <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Acción</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  Cargando…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[hsl(var(--destructive))]">
                  Error al cargar las órdenes de trabajo.
                </td>
              </tr>
            )}
            {!isLoading && !isError && workOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No hay órdenes de trabajo para los filtros seleccionados
                </td>
              </tr>
            )}
            {workOrders.map((wo) => {
              const hasRecord = !!wo.serviceRecord;
              return (
                <tr key={wo.id} className="border-b last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium whitespace-nowrap">
                    {wo.number}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium line-clamp-1">{wo.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {wo.client.tradeName ?? wo.client.legalName}
                      {wo.branch && <span> · {wo.branch.name}</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[hsl(var(--muted-foreground))] text-xs whitespace-nowrap">
                    {wo.scheduledAt
                      ? format(parseISO(wo.scheduledAt), "d MMM yyyy", { locale: es })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[wo.status]}>
                      {STATUS_LABELS[wo.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {hasRecord ? (
                      <Badge variant="success" className="gap-1">
                        <ClipboardCheck className="h-3 w-3" /> Creada
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pendiente</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {hasRecord ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs h-7"
                          onClick={() => setViewing(wo)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver acta
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs h-7"
                          onClick={() => setCreating(wo)}
                          disabled={wo.status === 'CANCELLED' || wo.status === 'DRAFT'}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Crear acta
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

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
          <span>
            {meta.total} orden{meta.total !== 1 ? 'es' : ''} · página {meta.page} de {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <CreateServiceRecordModal
        workOrder={creating}
        onOpenChange={(open) => { if (!open) setCreating(null); }}
      />
      <ViewServiceRecordModal
        workOrder={viewing}
        onOpenChange={(open) => { if (!open) setViewing(null); }}
      />
    </div>
  );
}
