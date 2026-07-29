import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Boxes, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

import type {
  ResourceCategory,
  ResourceOrigin,
  ResourceUtilization,
  WorkOrderStatus,
} from '@/lib/types';
import {
  useResourceUtilizations,
  useCreateResourceUtilization,
  useUpdateResourceUtilization,
  useDeleteResourceUtilization,
  type ResourceUtilizationFormData,
} from '@/hooks/use-resource-utilizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  MATERIAL: 'Material',
  LABOR: 'Mano de obra',
  EXPENSE: 'Gasto',
};

const ORIGIN_LABEL: Record<ResourceOrigin, string> = {
  PLANNED: 'Planeado',
  ADDITIONAL: 'Adicional en sitio',
};

const SELECT_CLASS =
  'w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  resourceName: z.string().min(1, 'El recurso es obligatorio').max(300),
  category: z.enum(['MATERIAL', 'LABOR', 'EXPENSE']),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  unit: z.string().min(1, 'La unidad es obligatoria').max(30),
  origin: z.enum(['PLANNED', 'ADDITIONAL']),
  observation: z.string().max(500).optional().or(z.literal('')),
});

type Schema = z.infer<typeof schema>;

function toDto(v: Schema): ResourceUtilizationFormData {
  return {
    resourceName: v.resourceName,
    category: v.category,
    quantity: v.quantity,
    unit: v.unit,
    origin: v.origin,
    observation: v.observation || undefined,
  };
}

// ─── Form modal ───────────────────────────────────────────────────────────────

interface FormModalProps {
  workOrderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ResourceUtilization | null;
}

function ResourceUtilizationFormModal({
  workOrderId,
  open,
  onOpenChange,
  editing,
}: FormModalProps) {
  const createUtil = useCreateResourceUtilization(workOrderId);
  const updateUtil = useUpdateResourceUtilization(workOrderId);
  const isPending = createUtil.isPending || updateUtil.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            resourceName: editing.resourceName,
            category: editing.category,
            quantity: parseFloat(editing.quantity),
            unit: editing.unit,
            origin: editing.origin,
            observation: editing.observation ?? '',
          }
        : {
            resourceName: '',
            category: 'MATERIAL',
            quantity: undefined as unknown as number,
            unit: 'unidad',
            origin: 'ADDITIONAL',
            observation: '',
          },
    );
  }, [open, editing, reset]);

  async function onSubmit(values: Schema) {
    const dto = toDto(values);
    if (editing) {
      await updateUtil.mutateAsync({ id: editing.id, data: dto });
    } else {
      await createUtil.mutateAsync(dto);
    }
    onOpenChange(false);
  }

  const apiError = (createUtil.error ?? updateUtil.error)?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Editar recurso utilizado' : 'Registrar recurso utilizado'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ru-name">Recurso *</Label>
            <Input
              id="ru-name"
              {...register('resourceName')}
              placeholder="Contactor del sistema de transferencia (ATS)…"
            />
            {errors.resourceName && (
              <p className="text-xs text-[hsl(var(--destructive))]">
                {errors.resourceName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ru-category">Categoría *</Label>
              <select id="ru-category" {...register('category')} className={SELECT_CLASS}>
                {(Object.keys(CATEGORY_LABEL) as ResourceCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ru-origin">Origen *</Label>
              <select id="ru-origin" {...register('origin')} className={SELECT_CLASS}>
                {(Object.keys(ORIGIN_LABEL) as ResourceOrigin[]).map((o) => (
                  <option key={o} value={o}>
                    {ORIGIN_LABEL[o]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ru-quantity">Cantidad *</Label>
              <Input
                id="ru-quantity"
                type="number"
                step="0.001"
                min="0"
                {...register('quantity')}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="text-xs text-[hsl(var(--destructive))]">
                  {errors.quantity.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ru-unit">Unidad *</Label>
              <Input id="ru-unit" {...register('unit')} placeholder="unidad, galón, hora…" />
              {errors.unit && (
                <p className="text-xs text-[hsl(var(--destructive))]">
                  {errors.unit.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ru-observation">Observación</Label>
            <Input
              id="ru-observation"
              {...register('observation')}
              placeholder="Reemplazo por sobretensión…"
            />
          </div>

          {apiError && (
            <p className="text-sm text-[hsl(var(--destructive))]">{apiError}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              {editing ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteConfirmDialog({
  workOrderId,
  utilization,
  onOpenChange,
}: {
  workOrderId: string;
  utilization: ResourceUtilization | null;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteUtil = useDeleteResourceUtilization(workOrderId);

  async function handleDelete() {
    if (!utilization) return;
    await deleteUtil.mutateAsync(utilization.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={!!utilization} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar recurso utilizado</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          ¿Seguro que deseas eliminar{' '}
          <span className="font-medium text-[hsl(var(--foreground))]">
            {utilization?.resourceName}
          </span>
          ?
        </p>
        {deleteUtil.error && (
          <p className="text-sm text-[hsl(var(--destructive))]">
            {deleteUtil.error.message}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={deleteUtil.isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteUtil.isPending}
          >
            {deleteUtil.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface ResourceUtilizationsCardProps {
  workOrderId: string;
  workOrderStatus: WorkOrderStatus;
}

export function ResourceUtilizationsCard({
  workOrderId,
  workOrderStatus,
}: ResourceUtilizationsCardProps) {
  const { data: utils, isLoading, isError } = useResourceUtilizations(workOrderId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceUtilization | null>(null);
  const [deleting, setDeleting] = useState<ResourceUtilization | null>(null);

  // Ventana editable = OT abierta (durante la ejecución). Congelada al cerrarse.
  const isReadOnly =
    workOrderStatus === 'COMPLETED' || workOrderStatus === 'CANCELLED';

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(u: ResourceUtilization) {
    setEditing(u);
    setFormOpen(true);
  }

  const hasUtils = utils && utils.length > 0;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5" />
              Recursos utilizados
            </CardTitle>
            {!isReadOnly && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={openCreate}
              >
                <Plus className="h-3 w-3" />
                Agregar recurso
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] px-6 pb-5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando recursos…
            </div>
          )}

          {isError && (
            <p className="text-sm text-[hsl(var(--destructive))] px-6 pb-5">
              Error al cargar los recursos utilizados.
            </p>
          )}

          {!isLoading && !isError && !hasUtils && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] px-6 pb-5 pt-1">
              Aún no se han registrado recursos utilizados en esta intervención.
            </p>
          )}

          {hasUtils && (
            <div className="divide-y">
              {utils.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 px-6 py-2.5 hover:bg-[hsl(var(--muted)/0.2)] group"
                >
                  <div className="min-w-0">
                    <p className="text-sm">
                      {u.resourceName}
                      <span className="ml-2 font-mono tabular-nums text-[hsl(var(--muted-foreground))]">
                        {parseFloat(u.quantity).toLocaleString('es-CO', {
                          maximumFractionDigits: 3,
                        })}{' '}
                        {u.unit}
                      </span>
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {CATEGORY_LABEL[u.category]} · {ORIGIN_LABEL[u.origin]}
                      {u.observation && ` · ${u.observation}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:block">
                      {format(parseISO(u.createdAt), 'd MMM', { locale: es })}
                    </span>
                    {!isReadOnly && (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Editar"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
                          title="Eliminar"
                          onClick={() => setDeleting(u)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!isReadOnly && (
        <>
          <ResourceUtilizationFormModal
            workOrderId={workOrderId}
            open={formOpen}
            onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) setEditing(null);
            }}
            editing={editing}
          />
          <DeleteConfirmDialog
            workOrderId={workOrderId}
            utilization={deleting}
            onOpenChange={(open) => {
              if (!open) setDeleting(null);
            }}
          />
        </>
      )}
    </>
  );
}
