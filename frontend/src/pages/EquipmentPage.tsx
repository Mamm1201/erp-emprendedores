import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Wrench, ChevronDown, Paperclip, QrCode, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

import {
  useEquipment,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
  useAssignQrCode,
  type EquipmentFormData,
} from '@/hooks/use-equipment';
import { useClients } from '@/hooks/use-clients';
import { useBranches } from '@/hooks/use-branches';
import { useAuth } from '@/contexts/AuthContext';
import type { Equipment, EquipmentType, EquipmentStatus } from '@/lib/types';
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
import { FileAttachmentSection } from '@/components/shared/FileAttachmentSection';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<EquipmentType, string> = {
  NURSE_CALL: 'Llamado enfermeras',
  MEDICAL_ALERT: 'Alerta médica',
  GENERATOR: 'Generador',
  UPS: 'UPS / No-break',
  ELECTRICAL: 'Panel eléctrico',
  OTHER: 'Otro',
};

const TYPE_OPTIONS: EquipmentType[] = [
  'NURSE_CALL',
  'MEDICAL_ALERT',
  'GENERATOR',
  'UPS',
  'ELECTRICAL',
  'OTHER',
];

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  DECOMMISSIONED: 'Dado de baja',
};

const STATUS_BADGE: Record<EquipmentStatus, 'success' | 'secondary' | 'danger'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  DECOMMISSIONED: 'danger',
};

const STATUS_OPTIONS: EquipmentStatus[] = ['ACTIVE', 'INACTIVE', 'DECOMMISSIONED'];

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const equipmentSchema = z.object({
  type: z.enum(['NURSE_CALL', 'MEDICAL_ALERT', 'GENERATOR', 'UPS', 'ELECTRICAL', 'OTHER']),
  brand: z.string().max(100).optional().or(z.literal('')),
  model: z.string().max(100).optional().or(z.literal('')),
  serialNumber: z.string().max(100).optional().or(z.literal('')),
  installDate: z.string().optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DECOMMISSIONED']).optional(),
});

type EquipmentSchema = z.infer<typeof equipmentSchema>;

function toFormValues(eq: Equipment): EquipmentSchema {
  return {
    type: eq.type,
    brand: eq.brand ?? '',
    model: eq.model ?? '',
    serialNumber: eq.serialNumber ?? '',
    installDate: eq.installDate ? eq.installDate.slice(0, 10) : '',
    location: eq.location ?? '',
    notes: eq.notes ?? '',
    status: eq.status,
  };
}

function toDto(values: EquipmentSchema): EquipmentFormData {
  return {
    type: values.type,
    brand: values.brand || undefined,
    model: values.model || undefined,
    serialNumber: values.serialNumber || undefined,
    installDate: values.installDate || undefined,
    location: values.location || undefined,
    notes: values.notes || undefined,
    status: values.status,
  };
}

// ─── EquipmentFormModal ───────────────────────────────────────────────────────

function EquipmentFormModal({
  open,
  onOpenChange,
  editing,
  clientId,
  branchId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Equipment | null;
  clientId: string;
  branchId: string;
}) {
  const createEq = useCreateEquipment();
  const updateEq = useUpdateEquipment();
  const isPending = createEq.isPending || updateEq.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EquipmentSchema>({
    resolver: zodResolver(equipmentSchema),
  });

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? toFormValues(editing)
          : { type: 'NURSE_CALL', brand: '', model: '', serialNumber: '', installDate: '', location: '', notes: '', status: 'ACTIVE' },
      );
    }
  }, [open, editing, reset]);

  async function onSubmit(values: EquipmentSchema) {
    const dto = toDto(values);
    if (editing) {
      await updateEq.mutateAsync({ clientId, branchId, id: editing.id, data: dto });
    } else {
      await createEq.mutateAsync({ clientId, branchId, data: dto });
    }
    onOpenChange(false);
  }

  const isEditing = !!editing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar equipo' : 'Registrar equipo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo */}
          <div className="space-y-1.5">
            <Label htmlFor="type">Tipo *</Label>
            <select id="type" {...register('type')} className={SELECT_CLASS}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
            {errors.type && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.type.message}</p>
            )}
          </div>

          {/* Marca y Modelo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" {...register('brand')} placeholder="Bosch, GE, Siemens…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Modelo</Label>
              <Input id="model" {...register('model')} placeholder="Referencia del modelo" />
            </div>
          </div>

          {/* Serial y Ubicación */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="serialNumber">N° Serie</Label>
              <Input id="serialNumber" {...register('serialNumber')} placeholder="SN-00001" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Ubicación</Label>
              <Input id="location" {...register('location')} placeholder="Piso 2, Sala UCI" />
            </div>
          </div>

          {/* Fecha instalación y Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="installDate">Fecha instalación</Label>
              <Input id="installDate" type="date" {...register('installDate')} />
            </div>
            {isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="status">Estado</Label>
                <select id="status" {...register('status')} className={SELECT_CLASS}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" {...register('notes')} placeholder="Observaciones técnicas…" rows={2} />
          </div>

          {(createEq.error || updateEq.error) && (
            <p className="text-sm text-[hsl(var(--destructive))]">
              {(createEq.error ?? updateEq.error)?.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Registrar equipo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

function DeleteConfirmDialog({
  equipment,
  clientId,
  branchId,
  onOpenChange,
}: {
  equipment: Equipment | null;
  clientId: string;
  branchId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteEq = useDeleteEquipment();

  async function handleDelete() {
    if (!equipment) return;
    await deleteEq.mutateAsync({ clientId, branchId, id: equipment.id });
    onOpenChange(false);
  }

  return (
    <Dialog open={!!equipment} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar equipo</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          ¿Seguro que deseas eliminar{' '}
          <span className="font-medium text-[hsl(var(--foreground))]">
            {equipment ? `${TYPE_LABELS[equipment.type]}${equipment.brand ? ` ${equipment.brand}` : ''}${equipment.model ? ` ${equipment.model}` : ''}` : ''}
          </span>?
          Se perderá el historial de actas asociadas.
        </p>
        {deleteEq.error && (
          <p className="text-sm text-[hsl(var(--destructive))]">{deleteEq.error.message}</p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={deleteEq.isPending}>Cancelar</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteEq.isPending}>
            {deleteEq.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── QrCodePanel ─────────────────────────────────────────────────────────────

const PORTAL_BASE =
  (import.meta.env.VITE_PORTAL_URL as string | undefined) ??
  'http://localhost:5174';

function buildPortalUrl(qrCode: string) {
  return `${PORTAL_BASE}/e/${qrCode}`;
}

function QrCodePanel({
  equipment,
  clientId,
  branchId,
  onOpenChange,
  onAssigned,
  isAdmin,
}: {
  equipment: Equipment | null;
  clientId: string;
  branchId: string;
  onOpenChange: (open: boolean) => void;
  onAssigned: (updated: Equipment) => void;
  isAdmin: boolean;
}) {
  const assign = useAssignQrCode();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleAssign = useCallback(async () => {
    if (!equipment) return;
    const updated = await assign.mutateAsync({ clientId, branchId, id: equipment.id });
    onAssigned(updated);
  }, [assign, clientId, branchId, equipment, onAssigned]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !equipment?.qrCode) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${equipment.qrCode}.png`;
    a.click();
  }, [equipment]);

  const displayName = equipment
    ? `${TYPE_LABELS[equipment.type]}${equipment.brand ? ` ${equipment.brand}` : ''}${equipment.model ? ` ${equipment.model}` : ''}`
    : '';

  return (
    <Dialog open={!!equipment} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Código QR — {displayName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          {equipment?.qrCode ? (
            <>
              <div className="p-3 rounded-lg border bg-white">
                <QRCodeCanvas
                  ref={canvasRef}
                  value={buildPortalUrl(equipment.qrCode)}
                  size={200}
                  level="M"
                  marginSize={2}
                />
              </div>
              <p className="text-xs font-mono text-[hsl(var(--muted-foreground))] select-all text-center break-all">
                {buildPortalUrl(equipment.qrCode)}
              </p>
              <Button className="w-full" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Descargar PNG
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 py-4 text-[hsl(var(--muted-foreground))]">
                <QrCode className="h-12 w-12 opacity-20" />
                <p className="text-sm">Este equipo no tiene un código QR asignado.</p>
              </div>
              {isAdmin && (
                <Button
                  className="w-full"
                  onClick={handleAssign}
                  disabled={assign.isPending}
                >
                  {assign.isPending ? 'Generando…' : 'Generar código QR'}
                </Button>
              )}
              {!isAdmin && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                  Solo un administrador puede generar el código QR.
                </p>
              )}
            </>
          )}
          {assign.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{assign.error.message}</p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── EquipmentPage ────────────────────────────────────────────────────────────

export function EquipmentPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [deleting, setDeleting] = useState<Equipment | null>(null);
  const [attachmentsEq, setAttachmentsEq] = useState<Equipment | null>(null);
  const [qrEq, setQrEq] = useState<Equipment | null>(null);

  const { data: clientsData } = useClients('', 1);
  const clients = clientsData?.data ?? [];

  const { data: branches } = useBranches(selectedClientId || null);

  const { data: equipmentData, isLoading, isError } = useEquipment(
    selectedClientId || null,
    selectedBranchId || null,
  );
  const equipmentList = equipmentData?.data ?? [];

  // Reset branch when client changes
  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    setSelectedBranchId('');
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(eq: Equipment) {
    setEditing(eq);
    setFormOpen(true);
  }

  const hasSelection = !!selectedClientId && !!selectedBranchId;
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedBranch = branches?.find((b) => b.id === selectedBranchId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipos</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Hoja de vida de equipos por sede
          </p>
        </div>
        <Button onClick={openCreate} disabled={!hasSelection}>
          <Plus className="h-4 w-4" />
          Registrar equipo
        </Button>
      </div>

      {/* Selector de contexto */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg border bg-[hsl(var(--muted)/0.3)]">
        <div className="flex-1 space-y-1.5">
          <Label>Cliente</Label>
          <div className="relative">
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Seleccionar cliente…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName ?? c.legalName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 pointer-events-none text-[hsl(var(--muted-foreground))]" />
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          <Label>Sede</Label>
          <div className="relative">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={!selectedClientId || !branches?.length}
              className={SELECT_CLASS}
            >
              <option value="">Seleccionar sede…</option>
              {(branches ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}{b.city ? ` — ${b.city}` : ''}
                  {b.isPrimary ? ' (principal)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 pointer-events-none text-[hsl(var(--muted-foreground))]" />
          </div>
        </div>
      </div>

      {/* Estado vacío — sin selección */}
      {!hasSelection && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-[hsl(var(--muted-foreground))]">
          <Wrench className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">Selecciona un cliente y una sede para ver sus equipos</p>
        </div>
      )}

      {/* Tabla de equipos */}
      {hasSelection && (
        <>
          {/* Contexto activo */}
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <span className="font-medium text-[hsl(var(--foreground))]">
              {selectedClient?.tradeName ?? selectedClient?.legalName}
            </span>
            <span>›</span>
            <span className="font-medium text-[hsl(var(--foreground))]">
              {selectedBranch?.name}
              {selectedBranch?.city ? ` (${selectedBranch.city})` : ''}
            </span>
            {!isLoading && (
              <span className="ml-auto">
                {equipmentList.length} equipo{equipmentList.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[hsl(var(--muted)/0.4)]">
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Marca / Modelo</th>
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell">N° Serie</th>
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden lg:table-cell">Ubicación</th>
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden lg:table-cell">Instalado</th>
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell">QR</th>
                  <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                      Cargando equipos…
                    </td>
                  </tr>
                )}
                {isError && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[hsl(var(--destructive))]">
                      Error al cargar los equipos.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && equipmentList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                      <Wrench className="h-6 w-6 mx-auto mb-2 opacity-30" />
                      No hay equipos registrados en esta sede.
                      <br />
                      <button
                        onClick={openCreate}
                        className="text-[hsl(var(--primary))] hover:underline text-sm mt-1"
                      >
                        Registrar el primer equipo
                      </button>
                    </td>
                  </tr>
                )}
                {equipmentList.map((eq) => (
                  <tr
                    key={eq.id}
                    className="border-b last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Badge variant="info" className="text-xs whitespace-nowrap">
                        {TYPE_LABELS[eq.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {eq.brand || eq.model ? (
                        <>
                          {eq.brand && <p className="font-medium">{eq.brand}</p>}
                          {eq.model && (
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{eq.model}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-[hsl(var(--muted-foreground))]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-xs">
                      {eq.serialNumber ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-[hsl(var(--muted-foreground))]">
                      {eq.location ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-[hsl(var(--muted-foreground))] text-xs">
                      {eq.installDate
                        ? format(parseISO(eq.installDate), 'dd/MM/yyyy', { locale: es })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[eq.status]}>
                        {STATUS_LABELS[eq.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <button
                        onClick={() => setQrEq(eq)}
                        title={eq.qrCode ? 'Ver / descargar QR' : 'Sin QR asignado'}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <QrCode
                          className={`h-4 w-4 ${eq.qrCode ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] opacity-40'}`}
                        />
                        <span className={eq.qrCode ? 'font-mono text-[10px] text-[hsl(var(--muted-foreground))]' : 'text-[hsl(var(--muted-foreground))] opacity-40'}>
                          {eq.qrCode ? eq.qrCode.slice(0, 6) + '…' : '—'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQrEq(eq)}
                          title={eq.qrCode ? 'Ver / descargar QR' : 'Generar QR'}
                          className="md:hidden"
                        >
                          <QrCode className={`h-4 w-4 ${eq.qrCode ? 'text-[hsl(var(--primary))]' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAttachmentsEq(eq)}
                          title="Adjuntos"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(eq)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(eq)}
                          title="Eliminar"
                          className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
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
        </>
      )}

      {/* Modals */}
      {hasSelection && (
        <>
          <EquipmentFormModal
            open={formOpen}
            onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) setEditing(null);
            }}
            editing={editing}
            clientId={selectedClientId}
            branchId={selectedBranchId}
          />
          <DeleteConfirmDialog
            equipment={deleting}
            clientId={selectedClientId}
            branchId={selectedBranchId}
            onOpenChange={(open) => {
              if (!open) setDeleting(null);
            }}
          />
          <QrCodePanel
            equipment={qrEq}
            clientId={selectedClientId}
            branchId={selectedBranchId}
            onOpenChange={(open) => { if (!open) setQrEq(null); }}
            onAssigned={(updated) => setQrEq(updated)}
            isAdmin={isAdmin}
          />
          <Dialog open={!!attachmentsEq} onOpenChange={(open) => { if (!open) setAttachmentsEq(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  Adjuntos —{' '}
                  {attachmentsEq
                    ? `${TYPE_LABELS[attachmentsEq.type]}${attachmentsEq.brand ? ` ${attachmentsEq.brand}` : ''}${attachmentsEq.model ? ` ${attachmentsEq.model}` : ''}`
                    : ''}
                </DialogTitle>
              </DialogHeader>
              {attachmentsEq && (
                <FileAttachmentSection
                  entityType="EQUIPMENT"
                  entityId={attachmentsEq.id}
                  label="Documentación"
                  defaultCategory="DOCUMENT"
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
