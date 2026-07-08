import type { UseFormRegister, FieldErrors } from 'react-hook-form';

import type { Branch, Technician } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Minimal shape expected from any form that uses these shared fields
export interface WorkOrderSharedFields {
  branchId?: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  assignedToId?: string;
}

interface WorkOrderFormFieldsProps {
  register: UseFormRegister<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<WorkOrderSharedFields>;
  branches: Branch[];
  branchesDisabled?: boolean;
  technicians: Technician[];
  disabled?: boolean;
}

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50';

export function WorkOrderFormFields({
  register,
  errors,
  branches,
  branchesDisabled = false,
  technicians,
  disabled = false,
}: WorkOrderFormFieldsProps) {
  return (
    <>
      {/* Sede */}
      <div className="space-y-1.5">
        <Label htmlFor="branchId">Sede</Label>
        <select
          id="branchId"
          {...register('branchId')}
          disabled={disabled || branchesDisabled}
          className={SELECT_CLASS}
        >
          <option value="">Sin sede específica</option>
          {branches.map((b) => (
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
          disabled={disabled}
        />
        {errors.title && (
          <p className="text-xs text-[hsl(var(--destructive))]">{errors.title.message as string}</p>
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
          disabled={disabled}
        />
      </div>

      {/* Fecha programada */}
      <div className="space-y-1.5">
        <Label htmlFor="scheduledAt">Fecha programada</Label>
        <Input
          id="scheduledAt"
          type="datetime-local"
          {...register('scheduledAt')}
          disabled={disabled}
        />
      </div>

      {/* Técnico asignado */}
      <div className="space-y-1.5">
        <Label htmlFor="assignedToId">Técnico asignado</Label>
        <select
          id="assignedToId"
          {...register('assignedToId')}
          disabled={disabled}
          className={SELECT_CLASS}
        >
          <option value="">Sin asignar</option>
          {technicians.length === 0 && (
            <option disabled>No hay técnicos disponibles</option>
          )}
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
