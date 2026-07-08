import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Pencil, ToggleLeft, ToggleRight, CalendarClock, ChevronRight } from 'lucide-react';

import {
  useMaintenancePlans,
  useCreateMaintenancePlan,
  useUpdateMaintenancePlan,
  type MaintenancePlanFormData,
} from '@/hooks/use-maintenance-plans';
import { useMaintenanceContracts } from '@/hooks/use-maintenance-contracts';
import type { MaintenancePlan, MaintenanceFrequency } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

const FREQUENCY_LABELS: Record<MaintenanceFrequency, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  EVERY_4_MONTHS: 'Cuatrimestral',
  BIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

const FREQUENCY_OPTIONS: MaintenanceFrequency[] = [
  'MONTHLY',
  'QUARTERLY',
  'EVERY_4_MONTHS',
  'BIANNUAL',
  'ANNUAL',
];

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const planSchema = z.object({
  contractId: z.string().min(1, 'Selecciona un contrato'),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'EVERY_4_MONTHS', 'BIANNUAL', 'ANNUAL']),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type PlanSchema = z.infer<typeof planSchema>;

function toFormValues(plan: MaintenancePlan): PlanSchema {
  return {
    contractId: plan.contractId,
    frequency: plan.frequency,
    startDate: plan.startDate.slice(0, 10),
    notes: plan.notes ?? '',
  };
}

// ─── PlanFormModal ────────────────────────────────────────────────────────────

function PlanFormModal({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: MaintenancePlan | null;
}) {
  const createPlan = useCreateMaintenancePlan();
  const updatePlan = useUpdateMaintenancePlan();
  const isPending = createPlan.isPending || updatePlan.isPending;

  const { data: contractsData } = useMaintenanceContracts({ status: 'ACTIVE' });
  const contracts = contractsData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanSchema>({ resolver: zodResolver(planSchema) });

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? toFormValues(editing)
          : { contractId: '', frequency: 'QUARTERLY', startDate: '', notes: '' },
      );
    }
  }, [open, editing, reset]);

  async function onSubmit(values: PlanSchema) {
    const dto: MaintenancePlanFormData = {
      contractId: values.contractId,
      frequency: values.frequency,
      startDate: values.startDate,
      notes: values.notes || undefined,
    };

    if (editing) {
      await updatePlan.mutateAsync({ id: editing.id, data: dto });
    } else {
      await createPlan.mutateAsync(dto);
    }
    onOpenChange(false);
  }

  const isEditing = !!editing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar plan' : 'Nuevo plan de mantenimiento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Contrato */}
          <div className="space-y-1.5">
            <Label htmlFor="contractId">Contrato *</Label>
            <select
              id="contractId"
              className={SELECT_CLASS}
              disabled={isEditing}
              {...register('contractId')}
            >
              <option value="">Seleccionar contrato activo…</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number} — {c.client.tradeName ?? c.client.legalName}
                </option>
              ))}
            </select>
            {errors.contractId && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.contractId.message}</p>
            )}
          </div>

          {/* Frecuencia */}
          <div className="space-y-1.5">
            <Label htmlFor="frequency">Frecuencia *</Label>
            <select id="frequency" className={SELECT_CLASS} {...register('frequency')}>
              {FREQUENCY_OPTIONS.map((f) => (
                <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
              ))}
            </select>
          </div>

          {/* Fecha inicio */}
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Fecha de inicio *</Label>
            <Input id="startDate" type="date" {...register('startDate')} />
            {errors.startDate && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.startDate.message}</p>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Observaciones del plan…"
              rows={2}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── MaintenancePlansPage ─────────────────────────────────────────────────────

const ACTIVE_FILTERS: { value: boolean | undefined; label: string }[] = [
  { value: undefined, label: 'Todos' },
  { value: true, label: 'Activos' },
  { value: false, label: 'Inactivos' },
];

export function MaintenancePlansPage() {
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenancePlan | null>(null);

  const updatePlan = useUpdateMaintenancePlan();

  const { data, isLoading, isError } = useMaintenancePlans({
    isActive: activeFilter,
    page,
  });

  const plans = data?.data ?? [];
  const meta = data?.meta;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(plan: MaintenancePlan) {
    setEditing(plan);
    setFormOpen(true);
  }

  function toggleActive(plan: MaintenancePlan) {
    updatePlan.mutate({ id: plan.id, data: { isActive: !plan.isActive } });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planes de mantenimiento</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Frecuencias de visita por contrato activo
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo plan
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-1">
        {ACTIVE_FILTERS.map(({ value, label }) => (
          <button
            key={String(value)}
            onClick={() => { setActiveFilter(value); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeFilter === value
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[hsl(var(--muted)/0.4)]">
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Contrato</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Frecuencia</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell">Inicio</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">Cargando…</td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[hsl(var(--destructive))]">Error al cargar los planes.</td>
              </tr>
            )}
            {!isLoading && !isError && plans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No hay planes registrados
                </td>
              </tr>
            )}
            {plans.map((plan) => (
              <tr
                key={plan.id}
                className={cn(
                  'border-b last:border-0 transition-colors',
                  plan.isActive
                    ? 'hover:bg-[hsl(var(--muted)/0.3)]'
                    : 'opacity-60 hover:bg-[hsl(var(--muted)/0.2)]',
                )}
              >
                <td className="px-4 py-3 font-mono font-medium">{plan.contract.number}</td>
                <td className="px-4 py-3">
                  {plan.contract.client.tradeName ?? plan.contract.client.legalName}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{FREQUENCY_LABELS[plan.frequency]}</Badge>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-[hsl(var(--muted-foreground))] text-xs">
                  {format(parseISO(plan.startDate.slice(0, 10)), 'dd/MM/yyyy', { locale: es })}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                    {plan.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(plan)} title="Editar plan">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(plan)}
                      title={plan.isActive ? 'Desactivar' : 'Activar'}
                      disabled={updatePlan.isPending}
                      className={plan.isActive ? 'text-[hsl(var(--muted-foreground))]' : 'text-[hsl(var(--primary))]'}
                    >
                      {plan.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" asChild title="Ver visitas">
                      <Link to={`/planes/${plan.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
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
          <span>{meta.total} plan{meta.total !== 1 ? 'es' : ''} · página {meta.page} de {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}>Siguiente</Button>
          </div>
        </div>
      )}

      <PlanFormModal open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} editing={editing} />
    </div>
  );
}
