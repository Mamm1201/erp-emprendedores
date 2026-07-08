import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Pencil, Trash2, FileSignature } from 'lucide-react';

import {
  useMaintenanceContracts,
  useCreateMaintenanceContract,
  useUpdateMaintenanceContract,
  useDeleteMaintenanceContract,
  type ContractFormData,
  type ContractUpdateData,
} from '@/hooks/use-maintenance-contracts';
import { useClients } from '@/hooks/use-clients';
import type { MaintenanceContract, ContractStatus, BillingCycle, ServiceHoursLevel } from '@/lib/types';
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

const STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  EXPIRED: 'Vencido',
  CANCELLED: 'Cancelado',
  SUSPENDED: 'Suspendido',
};

const STATUS_BADGE: Record<ContractStatus, 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
  DRAFT: 'secondary',
  ACTIVE: 'success',
  EXPIRED: 'warning',
  CANCELLED: 'danger',
  SUSPENDED: 'info',
};

const STATUS_OPTIONS: ContractStatus[] = ['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'];

const BILLING_LABELS: Record<BillingCycle, string> = {
  MONTHLY: 'Mensual',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  EVERY_4_MONTHS: 'Cuatrimestral',
  BIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

const BILLING_OPTIONS: BillingCycle[] = [
  'MONTHLY',
  'BIMONTHLY',
  'QUARTERLY',
  'EVERY_4_MONTHS',
  'BIANNUAL',
  'ANNUAL',
];

const SERVICE_HOURS_LABELS: Record<ServiceHoursLevel, string> = {
  BUSINESS_HOURS: 'Horario hábil',
  EXTENDED: 'Horario extendido',
  FULL_24_7: '24/7',
};

const SERVICE_HOURS_OPTIONS: ServiceHoursLevel[] = [
  'BUSINESS_HOURS',
  'EXTENDED',
  'FULL_24_7',
];

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const contractSchema = z.object({
  clientId: z.string().min(1, 'Selecciona un cliente'),
  billingCycle: z.enum(['MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'EVERY_4_MONTHS', 'BIANNUAL', 'ANNUAL']),
  value: z.coerce.number().positive('El valor debe ser mayor a 0'),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().min(1, 'La fecha de fin es obligatoria'),
  serviceHours: z.enum(['BUSINESS_HOURS', 'EXTENDED', 'FULL_24_7']).optional(),
  correctiveIncluded: z.boolean().optional(),
  partsIncluded: z.boolean().optional(),
  transportIncluded: z.boolean().optional(),
  slaHoursCritical: z.coerce.number().int().min(1).optional().or(z.literal('')),
  slaHoursHigh: z.coerce.number().int().min(1).optional().or(z.literal('')),
  slaHoursMedium: z.coerce.number().int().min(1).optional().or(z.literal('')),
  slaHoursLow: z.coerce.number().int().min(1).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type ContractSchemaType = z.infer<typeof contractSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return format(parseISO(iso.slice(0, 10)), 'd MMM yyyy', { locale: es });
  } catch {
    return iso;
  }
}

function fmtMoney(v: string) {
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function buildDefaults(contract?: MaintenanceContract): ContractSchemaType {
  if (!contract) {
    return {
      clientId: '',
      billingCycle: 'QUARTERLY',
      value: 0,
      startDate: '',
      endDate: '',
      serviceHours: 'BUSINESS_HOURS',
      correctiveIncluded: false,
      partsIncluded: false,
      transportIncluded: false,
      slaHoursCritical: '',
      slaHoursHigh: '',
      slaHoursMedium: '',
      slaHoursLow: '',
      notes: '',
    };
  }
  return {
    clientId: contract.client.id,
    billingCycle: contract.billingCycle,
    value: parseFloat(contract.value),
    startDate: contract.startDate.slice(0, 10),
    endDate: contract.endDate.slice(0, 10),
    serviceHours: contract.serviceHours,
    correctiveIncluded: contract.correctiveIncluded,
    partsIncluded: contract.partsIncluded,
    transportIncluded: contract.transportIncluded,
    slaHoursCritical: contract.slaHoursCritical ?? '',
    slaHoursHigh: contract.slaHoursHigh ?? '',
    slaHoursMedium: contract.slaHoursMedium ?? '',
    slaHoursLow: contract.slaHoursLow ?? '',
    notes: contract.notes ?? '',
  };
}

// ─── Contract Form Modal ──────────────────────────────────────────────────────

interface ContractFormModalProps {
  open: boolean;
  onClose: () => void;
  editing?: MaintenanceContract;
}

function ContractFormModal({ open, onClose, editing }: ContractFormModalProps) {
  const { data: clientsData } = useClients();
  const createContract = useCreateMaintenanceContract();
  const updateContract = useUpdateMaintenanceContract();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContractSchemaType>({
    resolver: zodResolver(contractSchema),
    defaultValues: buildDefaults(editing),
  });

  const isEdit = !!editing;

  function handleClose() {
    reset(buildDefaults(editing));
    onClose();
  }

  async function onSubmit(values: ContractSchemaType) {
    const slaNum = (v: number | '' | undefined) =>
      typeof v === 'number' && !isNaN(v) ? v : undefined;

    if (isEdit) {
      const data: ContractUpdateData = {
        billingCycle: values.billingCycle,
        value: values.value,
        startDate: values.startDate,
        endDate: values.endDate,
        serviceHours: values.serviceHours,
        correctiveIncluded: values.correctiveIncluded,
        partsIncluded: values.partsIncluded,
        transportIncluded: values.transportIncluded,
        slaHoursCritical: slaNum(values.slaHoursCritical as number | ''),
        slaHoursHigh: slaNum(values.slaHoursHigh as number | ''),
        slaHoursMedium: slaNum(values.slaHoursMedium as number | ''),
        slaHoursLow: slaNum(values.slaHoursLow as number | ''),
        notes: values.notes || undefined,
      };
      await updateContract.mutateAsync({ id: editing.id, data });
    } else {
      const data: ContractFormData = {
        clientId: values.clientId,
        billingCycle: values.billingCycle,
        value: values.value,
        startDate: values.startDate,
        endDate: values.endDate,
        serviceHours: values.serviceHours,
        correctiveIncluded: values.correctiveIncluded,
        partsIncluded: values.partsIncluded,
        transportIncluded: values.transportIncluded,
        slaHoursCritical: slaNum(values.slaHoursCritical as number | ''),
        slaHoursHigh: slaNum(values.slaHoursHigh as number | ''),
        slaHoursMedium: slaNum(values.slaHoursMedium as number | ''),
        slaHoursLow: slaNum(values.slaHoursLow as number | ''),
        notes: values.notes || undefined,
      };
      await createContract.mutateAsync(data);
    }
    handleClose();
  }

  const clients = clientsData?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Editar contrato ${editing.number}` : 'Nuevo contrato de mantenimiento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">

          {/* Cliente */}
          <div className="space-y-1">
            <Label htmlFor="clientId">Cliente *</Label>
            <select
              id="clientId"
              className={SELECT_CLASS}
              disabled={isEdit}
              {...register('clientId')}
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

          {/* Ciclo de facturación + Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="billingCycle">Ciclo de facturación *</Label>
              <select id="billingCycle" className={SELECT_CLASS} {...register('billingCycle')}>
                {BILLING_OPTIONS.map((b) => (
                  <option key={b} value={b}>{BILLING_LABELS[b]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="value">Valor del contrato (COP) *</Label>
              <Input
                id="value"
                type="number"
                step="1"
                min="1"
                placeholder="0"
                {...register('value')}
              />
              {errors.value && (
                <p className="text-xs text-[hsl(var(--destructive))]">{errors.value.message}</p>
              )}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="startDate">Fecha inicio *</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-xs text-[hsl(var(--destructive))]">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate">Fecha fin *</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && (
                <p className="text-xs text-[hsl(var(--destructive))]">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Horario de servicio */}
          <div className="space-y-1">
            <Label htmlFor="serviceHours">Horario de atención</Label>
            <select id="serviceHours" className={SELECT_CLASS} {...register('serviceHours')}>
              {SERVICE_HOURS_OPTIONS.map((s) => (
                <option key={s} value={s}>{SERVICE_HOURS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* Inclusiones */}
          <div className="space-y-2">
            <Label>Incluye en el contrato</Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded" {...register('correctiveIncluded')} />
                Correctivo
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded" {...register('partsIncluded')} />
                Repuestos
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded" {...register('transportIncluded')} />
                Transporte
              </label>
            </div>
          </div>

          {/* SLA */}
          <div className="space-y-1">
            <Label>SLA — tiempo de respuesta (horas)</Label>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Crítico</p>
                <Input type="number" min="1" placeholder="—" {...register('slaHoursCritical')} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Alto</p>
                <Input type="number" min="1" placeholder="—" {...register('slaHoursHigh')} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Medio</p>
                <Input type="number" min="1" placeholder="—" {...register('slaHoursMedium')} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Bajo</p>
                <Input type="number" min="1" placeholder="—" {...register('slaHoursLow')} />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" rows={3} placeholder="Observaciones del contrato…" {...register('notes')} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear contrato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status Change Modal ──────────────────────────────────────────────────────

interface StatusModalProps {
  contract: MaintenanceContract;
  onClose: () => void;
}

function StatusModal({ contract, onClose }: StatusModalProps) {
  const updateContract = useUpdateMaintenanceContract();
  const [status, setStatus] = useState<ContractStatus>(contract.status);

  async function handleSave() {
    await updateContract.mutateAsync({ id: contract.id, data: { status } });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar estado — {contract.number}</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-2">
          <Label htmlFor="status">Estado</Label>
          <select
            id="status"
            className={SELECT_CLASS}
            value={status}
            onChange={(e) => setStatus(e.target.value as ContractStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={updateContract.isPending}>
            {updateContract.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MaintenanceContractsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<MaintenanceContract | null>(null);
  const [changingStatus, setChangingStatus] = useState<MaintenanceContract | null>(null);
  const [deleting, setDeleting] = useState<MaintenanceContract | null>(null);

  const deleteContract = useDeleteMaintenanceContract();

  const { data, isLoading } = useMaintenanceContracts({
    search: search || undefined,
    status: statusFilter || undefined,
    page,
  });

  const contracts = data?.data ?? [];
  const meta = data?.meta;

  async function handleDelete() {
    if (!deleting) return;
    await deleteContract.mutateAsync(deleting.id);
    setDeleting(null);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSignature className="h-6 w-6 text-[hsl(var(--primary))]" />
          <div>
            <h1 className="text-xl font-semibold">Contratos de mantenimiento</h1>
            <p className="text-sm text-muted-foreground">
              {meta ? `${meta.total} contrato${meta.total !== 1 ? 's' : ''}` : '—'}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo contrato
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Buscar por número, cliente…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <select
          className={SELECT_CLASS + ' max-w-[180px]'}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as ContractStatus | ''); setPage(1); }}
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Número</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vigencia</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Facturación</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && contracts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No hay contratos registrados.
                </td>
              </tr>
            )}
            {contracts.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono font-medium">{c.number}</td>
                <td className="px-4 py-3">
                  {c.client.tradeName ?? c.client.legalName}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_BADGE[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {fmtDate(c.startDate)} — {fmtDate(c.endDate)}
                </td>
                <td className="px-4 py-3 font-medium">{fmtMoney(c.value)}</td>
                <td className="px-4 py-3 text-muted-foreground">{BILLING_LABELS[c.billingCycle]}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Cambiar estado"
                      onClick={() => setChangingStatus(c)}
                    >
                      <FileSignature className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Editar"
                      onClick={() => setEditing(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Eliminar"
                      className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
                      onClick={() => setDeleting(c)}
                    >
                      <Trash2 className="h-4 w-4" />
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {meta.page} de {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <ContractFormModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editing && (
        <ContractFormModal
          open={!!editing}
          editing={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {changingStatus && (
        <StatusModal
          contract={changingStatus}
          onClose={() => setChangingStatus(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <Dialog open onOpenChange={(v) => { if (!v) setDeleting(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Eliminar contrato</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              ¿Eliminar el contrato <span className="font-mono font-medium">{deleting.number}</span>?
              Solo se pueden eliminar contratos que no estén en estado Activo.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={deleteContract.isPending}
                onClick={handleDelete}
              >
                {deleteContract.isPending ? 'Eliminando…' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
