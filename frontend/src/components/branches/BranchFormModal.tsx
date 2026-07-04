import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  useCreateBranch,
  useUpdateBranch,
  type BranchFormData,
} from '@/hooks/use-branches';
import type { Branch } from '@/lib/types';
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

// ─── Schema ───────────────────────────────────────────────────────────────────

const branchSchema = z.object({
  name:         z.string().min(1, 'El nombre es obligatorio').max(200),
  contactName:  z.string().max(200).optional().or(z.literal('')),
  contactPhone: z.string().max(50).optional().or(z.literal('')),
  email:        z.string().email('Email inválido').optional().or(z.literal('')),
  address:      z.string().max(500).optional().or(z.literal('')),
  city:         z.string().max(100).optional().or(z.literal('')),
  department:   z.string().max(100).optional().or(z.literal('')),
  isPrimary:    z.boolean().optional(),
  notes:        z.string().max(2000).optional().or(z.literal('')),
});

type BranchSchema = z.infer<typeof branchSchema>;

function toDto(values: BranchSchema): BranchFormData {
  return {
    name:         values.name,
    contactName:  values.contactName  || undefined,
    contactPhone: values.contactPhone || undefined,
    email:        values.email        || undefined,
    address:      values.address      || undefined,
    city:         values.city         || undefined,
    department:   values.department   || undefined,
    isPrimary:    values.isPrimary,
    notes:        values.notes        || undefined,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BranchFormModalProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Branch | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BranchFormModal({
  clientId,
  open,
  onOpenChange,
  editing,
}: BranchFormModalProps) {
  const createBranch = useCreateBranch(clientId);
  const updateBranch = useUpdateBranch(clientId);
  const isPending = createBranch.isPending || updateBranch.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchSchema>({ resolver: zodResolver(branchSchema) });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            name:         editing.name,
            contactName:  editing.contactName  ?? '',
            contactPhone: editing.contactPhone ?? '',
            email:        editing.email        ?? '',
            address:      editing.address      ?? '',
            city:         editing.city         ?? '',
            department:   editing.department   ?? '',
            isPrimary:    editing.isPrimary,
            notes:        editing.notes        ?? '',
          }
        : {
            name: '', contactName: '', contactPhone: '', email: '',
            address: '', city: '', department: '', isPrimary: false, notes: '',
          },
    );
  }, [open, editing, reset]);

  async function onSubmit(values: BranchSchema) {
    const dto = toDto(values);
    if (editing) {
      await updateBranch.mutateAsync({ id: editing.id, data: dto });
    } else {
      await createBranch.mutateAsync(dto);
    }
    onOpenChange(false);
  }

  const apiError = (createBranch.error ?? updateBranch.error)?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar sede' : 'Nueva sede'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Nombre + Sede principal */}
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="branch-name">Nombre de la sede *</Label>
              <Input
                id="branch-name"
                {...register('name')}
                placeholder="Sede Norte, Torre B, Urgencias…"
              />
              {errors.name && (
                <p className="text-xs text-[hsl(var(--destructive))]">{errors.name.message}</p>
              )}
            </div>
            <div className="pt-7 shrink-0">
              <label htmlFor="branch-isPrimary" className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  id="branch-isPrimary"
                  type="checkbox"
                  {...register('isPrimary')}
                  className="accent-[hsl(var(--primary))] h-4 w-4"
                />
                Sede principal
              </label>
            </div>
          </div>

          {/* Contacto + Teléfono */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="branch-contact">Contacto</Label>
              <Input id="branch-contact" {...register('contactName')} placeholder="Jefe de mantenimiento" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branch-phone">Teléfono</Label>
              <Input id="branch-phone" {...register('contactPhone')} placeholder="601 234 5678" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="branch-email">Email</Label>
            <Input id="branch-email" type="email" {...register('email')} placeholder="mantenimiento@sede.com" />
            {errors.email && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.email.message}</p>
            )}
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label htmlFor="branch-address">Dirección</Label>
            <Input id="branch-address" {...register('address')} placeholder="Cra. 50 # 26-20" />
          </div>

          {/* Ciudad + Departamento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="branch-city">Ciudad</Label>
              <Input id="branch-city" {...register('city')} placeholder="Medellín" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branch-dept">Departamento</Label>
              <Input id="branch-dept" {...register('department')} placeholder="Antioquia" />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="branch-notes">Notas</Label>
            <Textarea id="branch-notes" {...register('notes')} placeholder="Observaciones opcionales…" rows={2} />
          </div>

          {apiError && (
            <p className="text-sm text-[hsl(var(--destructive))]">{apiError}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear sede'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
