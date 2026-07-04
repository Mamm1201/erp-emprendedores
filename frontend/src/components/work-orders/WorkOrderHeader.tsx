import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

import type { WorkOrder, WorkOrderStatus } from '@/lib/types';
import { useUpdateWorkOrderStatus } from '@/hooks/use-work-orders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Status display config ────────────────────────────────────────────────────

const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  DRAFT:       'Borrador',
  SCHEDULED:   'Programada',
  IN_PROGRESS: 'En progreso',
  COMPLETED:   'Completada',
  CANCELLED:   'Cancelada',
};

const STATUS_VARIANT: Record<WorkOrderStatus, 'secondary' | 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT:       'secondary',
  SCHEDULED:   'info',
  IN_PROGRESS: 'warning',
  COMPLETED:   'success',
  CANCELLED:   'danger',
};

// Allowed forward transitions per status
const NEXT_STATUS: Partial<Record<WorkOrderStatus, WorkOrderStatus>> = {
  DRAFT:       'SCHEDULED',
  SCHEDULED:   'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
};

const NEXT_LABEL: Partial<Record<WorkOrderStatus, string>> = {
  DRAFT:       'Programar',
  SCHEDULED:   'Iniciar',
  IN_PROGRESS: 'Completar',
};

const CANCELLABLE: WorkOrderStatus[] = ['DRAFT', 'SCHEDULED', 'IN_PROGRESS'];

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkOrderHeaderProps {
  workOrder: WorkOrder;
  onCreateInvoice: () => void;
  onViewInvoice: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkOrderHeader({ workOrder, onCreateInvoice, onViewInvoice }: WorkOrderHeaderProps) {
  const navigate   = useNavigate();
  const updateStatus = useUpdateWorkOrderStatus();

  const { id, number, status, invoice } = workOrder;
  const nextStatus = NEXT_STATUS[status];
  const isPending  = updateStatus.isPending;

  function handleTransition(target: WorkOrderStatus) {
    updateStatus.mutate({ id, status: target });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

      {/* Left — back + identity */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={() => navigate('/ordenes')}
          title="Volver a órdenes"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold font-mono tracking-tight">{number}</h1>
            <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] truncate mt-0.5">
            {workOrder.title}
          </p>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 flex-wrap shrink-0 pl-11 sm:pl-0">

        {/* Primary forward transition */}
        {nextStatus && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => handleTransition(nextStatus)}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {NEXT_LABEL[status]}
          </Button>
        )}

        {/* Invoice actions (COMPLETED) */}
        {status === 'COMPLETED' && !invoice && (
          <Button size="sm" variant="outline" onClick={onCreateInvoice}>
            Crear cuenta de cobro
          </Button>
        )}
        {status === 'COMPLETED' && invoice && (
          <Button size="sm" variant="outline" onClick={onViewInvoice}>
            Ver cuenta de cobro
          </Button>
        )}

        {/* Cancel */}
        {CANCELLABLE.includes(status) && (
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            className={cn('text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]')}
            onClick={() => handleTransition('CANCELLED')}
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
