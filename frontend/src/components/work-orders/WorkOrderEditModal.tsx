import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import type { WorkOrder, WorkOrderStatus } from '@/lib/types';
import { useUpdateWorkOrder } from '@/hooks/use-work-orders';
import { useTechnicians } from '@/hooks/use-users';
import { useBranches } from '@/hooks/use-branches';
import { useEquipment } from '@/hooks/use-equipment';
import { WorkOrderFormFields } from './WorkOrderFormFields';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// Statuses that allow editing. Backend validation is pending (tech debt).
const EDITABLE_STATUSES: WorkOrderStatus[] = ['DRAFT', 'SCHEDULED'];

const editSchema = z.object({
  branchId: z.string().optional(),
  equipmentId: z.string().optional(),
  title: z.string().min(1, 'El título es obligatorio').max(300),
  description: z.string().max(2000).optional().or(z.literal('')),
  scheduledAt: z.string().optional().or(z.literal('')),
  assignedToId: z.string().optional(),
});

type EditSchema = z.infer<typeof editSchema>;

interface WorkOrderEditModalProps {
  workOrder: WorkOrder;
  open: boolean;
  onClose: () => void;
}

export function WorkOrderEditModal({ workOrder, open, onClose }: WorkOrderEditModalProps) {
  const isEditable = EDITABLE_STATUSES.includes(workOrder.status);
  const updateWO = useUpdateWorkOrder(workOrder.id);
  const { data: technicians = [] } = useTechnicians();
  const { data: branches = [] } = useBranches(workOrder.client.id);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditSchema>({
    resolver: zodResolver(editSchema),
    defaultValues: buildDefaults(workOrder),
  });

  const selectedBranchId = watch('branchId');
  const { data: equipmentData } = useEquipment(
    workOrder.client.id,
    selectedBranchId || null,
  );
  const equipmentList = equipmentData?.data ?? [];

  useEffect(() => {
    if (open) reset(buildDefaults(workOrder));
  }, [open, workOrder, reset]);

  async function onSubmit(values: EditSchema) {
    // Second guard: reject if state changed between open and submit
    if (!isEditable) return;

    await updateWO.mutateAsync({
      branchId: values.branchId || undefined,
      equipmentId: values.equipmentId || undefined,
      title: values.title,
      description: values.description || undefined,
      scheduledAt: values.scheduledAt || undefined,
      assignedToId: values.assignedToId || undefined,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar orden de trabajo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <WorkOrderFormFields
            register={register}
            errors={errors}
            branches={branches}
            technicians={technicians}
            equipment={selectedBranchId ? equipmentList : undefined}
            disabled={!isEditable}
          />

          {!isEditable && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Solo se pueden editar órdenes en estado Borrador o Programada.
            </p>
          )}

          {updateWO.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{updateWO.error.message}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={updateWO.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!isEditable || updateWO.isPending}>
              {updateWO.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function buildDefaults(wo: WorkOrder): EditSchema {
  return {
    branchId: wo.branch?.id ?? '',
    equipmentId: wo.equipmentId ?? '',
    title: wo.title,
    description: wo.description ?? '',
    scheduledAt: wo.scheduledAt ? wo.scheduledAt.slice(0, 16) : '',
    assignedToId: wo.assignedTo?.id ?? '',
  };
}
