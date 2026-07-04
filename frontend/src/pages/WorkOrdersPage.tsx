import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Search, Trash2, ChevronRight } from 'lucide-react';

import {
  useWorkOrders,
  useCreateWorkOrder,
  useUpdateWorkOrderStatus,
  useDeleteWorkOrder,
  type WorkOrderFormData,
} from '@/hooks/use-work-orders';
import { useClients } from '@/hooks/use-clients';
import { useBranches } from '@/hooks/use-branches';
import type { WorkOrder, WorkOrderStatus } from '@/lib/types';
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

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const STATUS_BADGE: Record<WorkOrderStatus, 'secondary' | 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'secondary',
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const NEXT_STATUS: Partial<Record<WorkOrderStatus, { status: WorkOrderStatus; label: string }>> = {
  DRAFT: { status: 'SCHEDULED', label: 'Programar' },
  SCHEDULED: { status: 'IN_PROGRESS', label: 'Iniciar' },
  IN_PROGRESS: { status: 'COMPLETED', label: 'Completar' },
};

const CANCELLABLE: WorkOrderStatus[] = ['DRAFT', 'SCHEDULED', 'IN_PROGRESS'];

const STATUS_FILTERS: { value: WorkOrderStatus | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'SCHEDULED', label: 'Programadas' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

// ─── Zod schema ───────────────────────────────────────────────────────────────

const workOrderSchema = z.object({
  clientId: z.string().min(1, 'Selecciona un cliente'),
  branchId: z.string().optional(),
  title: z.string().min(1, 'El título es obligatorio').max(300),
  description: z.string().max(2000).optional().or(z.literal('')),
  scheduledAt: z.string().optional().or(z.literal('')),
});

type WorkOrderSchema = z.infer<typeof workOrderSchema>;

// ─── WorkOrderFormModal ───────────────────────────────────────────────────────

function WorkOrderFormModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createWO = useCreateWorkOrder();
  const { data: clientsData } = useClients('', 1);
  const clients = clientsData?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<WorkOrderSchema>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: { clientId: '', branchId: '', title: '', description: '', scheduledAt: '' },
  });

  const selectedClientId = watch('clientId');
  const { data: branches } = useBranches(selectedClientId || null);

  useEffect(() => {
    if (open) reset({ clientId: '', branchId: '', title: '', description: '', scheduledAt: '' });
  }, [open, reset]);

  async function onSubmit(values: WorkOrderSchema) {
    const dto: WorkOrderFormData = {
      clientId: values.clientId,
      branchId: values.branchId || undefined,
      title: values.title,
      description: values.description || undefined,
      scheduledAt: values.scheduledAt || undefined,
    };
    await createWO.mutateAsync(dto);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva orden de trabajo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Cliente */}
          <div className="space-y-1.5">
            <Label htmlFor="clientId">Cliente *</Label>
            <select
              id="clientId"
              {...register('clientId')}
              className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <option value="">Seleccionar cliente…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName ?? c.legalName}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.clientId.message}</p>
            )}
          </div>

          {/* Sede */}
          <div className="space-y-1.5">
            <Label htmlFor="branchId">Sede</Label>
            <select
              id="branchId"
              {...register('branchId')}
              disabled={!selectedClientId || !branches?.length}
              className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50"
            >
              <option value="">Sin sede específica</option>
              {(branches ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}{b.city ? ` — ${b.city}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Mantenimiento preventivo trimestral"
            />
            {errors.title && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.title.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Detalles del trabajo a realizar…"
              rows={3}
            />
          </div>

          {/* Fecha programada */}
          <div className="space-y-1.5">
            <Label htmlFor="scheduledAt">Fecha programada</Label>
            <Input id="scheduledAt" type="datetime-local" {...register('scheduledAt')} />
          </div>

          {createWO.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{createWO.error.message}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={createWO.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createWO.isPending}>
              {createWO.isPending ? 'Creando…' : 'Crear OT'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

function DeleteConfirmDialog({
  workOrder,
  onOpenChange,
}: {
  workOrder: WorkOrder | null;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteWO = useDeleteWorkOrder();

  async function handleDelete() {
    if (!workOrder) return;
    await deleteWO.mutateAsync(workOrder.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={!!workOrder} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar orden de trabajo</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          ¿Seguro que deseas eliminar la OT{' '}
          <span className="font-medium text-[hsl(var(--foreground))]">{workOrder?.number}</span>{' '}
          — {workOrder?.title}?
        </p>
        {deleteWO.error && (
          <p className="text-sm text-[hsl(var(--destructive))]">{deleteWO.error.message}</p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={deleteWO.isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteWO.isPending}>
            {deleteWO.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── StatusActions ────────────────────────────────────────────────────────────

function StatusActions({ workOrder }: { workOrder: WorkOrder }) {
  const updateStatus = useUpdateWorkOrderStatus();
  const navigate = useNavigate();
  const next = NEXT_STATUS[workOrder.status];
  const canCancel = CANCELLABLE.includes(workOrder.status);
  const isBusy = updateStatus.isPending;
  const canCreateInvoice =
    workOrder.status === 'COMPLETED' && !workOrder.invoice;

  return (
    <div className="flex justify-end gap-1 flex-wrap">
      {next && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-xs h-7"
          disabled={isBusy}
          onClick={() => updateStatus.mutate({ id: workOrder.id, status: next.status })}
        >
          {next.label}
          <ChevronRight className="h-3 w-3" />
        </Button>
      )}
      {canCreateInvoice && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-xs h-7 text-node-teal border-node-teal/30 hover:bg-node-teal/10"
          onClick={() =>
            navigate(`/cuentas-cobro/nueva?workOrderId=${workOrder.id}`)
          }
        >
          Crear CC
        </Button>
      )}
      {workOrder.invoice && workOrder.status === 'COMPLETED' && (
        <Button
          size="sm"
          variant="ghost"
          className="gap-1 text-xs h-7 font-mono"
          onClick={() => navigate(`/cuentas-cobro/${workOrder.invoice!.id}`)}
        >
          {workOrder.invoice.number}
        </Button>
      )}
      {canCancel && (
        <Button
          size="sm"
          variant="ghost"
          className="gap-1 text-xs h-7 text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
          disabled={isBusy}
          onClick={() => updateStatus.mutate({ id: workOrder.id, status: 'CANCELLED' })}
        >
          Cancelar
        </Button>
      )}
    </div>
  );
}

// ─── WorkOrdersPage ───────────────────────────────────────────────────────────

export function WorkOrdersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<WorkOrder | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useWorkOrders({ search, status: statusFilter, page });
  const workOrders = data?.data ?? [];
  const meta = data?.meta;

  function handleStatusFilter(value: WorkOrderStatus | '') {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Órdenes de trabajo</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Gestión y seguimiento de visitas técnicas
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva OT
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleStatusFilter(value)}
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

        {/* Search */}
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
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Título</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden lg:table-cell">Cliente / Sede</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell whitespace-nowrap">Fecha programada</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Acciones</th>
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
                  {search || statusFilter
                    ? 'Sin resultados para los filtros aplicados'
                    : 'No hay órdenes de trabajo registradas'}
                </td>
              </tr>
            )}
            {workOrders.map((wo) => (
              <tr
                key={wo.id}
                className="border-b last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs font-medium whitespace-nowrap">
                  <button
                    onClick={() => navigate(`/ordenes/${wo.id}`)}
                    className="text-[hsl(var(--primary))] hover:underline underline-offset-2"
                  >
                    {wo.number}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium line-clamp-1">{wo.title}</p>
                  {wo.description && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1 mt-0.5">
                      {wo.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <p className="font-medium text-sm">
                    {wo.client.tradeName ?? wo.client.legalName}
                  </p>
                  {wo.branch && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {wo.branch.name}{wo.branch.city ? ` · ${wo.branch.city}` : ''}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                  {wo.scheduledAt
                    ? format(parseISO(wo.scheduledAt), "d MMM yyyy, HH:mm", { locale: es })
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_BADGE[wo.status]}>
                    {STATUS_LABELS[wo.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end items-center gap-1">
                    <StatusActions workOrder={wo} />
                    {wo.status === 'DRAFT' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleting(wo)}
                        className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))] h-7 w-7"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
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

      <WorkOrderFormModal open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteConfirmDialog workOrder={deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }} />
    </div>
  );
}
