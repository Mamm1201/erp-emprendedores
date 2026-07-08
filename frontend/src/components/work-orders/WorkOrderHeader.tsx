import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, FileDown } from 'lucide-react';

import type { WorkOrder, WorkOrderStatus } from '@/lib/types';
import { useUpdateWorkOrderStatus } from '@/hooks/use-work-orders';
import { getApiToken } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function downloadServiceRecordPdf(workOrderId: string, workOrderNumber: string) {
  const token = getApiToken();
  const res = await fetch(`${BASE_URL}/documents/work-orders/${workOrderId}/service-record/pdf`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `acta-tecnica-${workOrderNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

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

const EDITABLE_STATUSES: WorkOrderStatus[] = ['DRAFT', 'SCHEDULED'];

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

const INVOICE_STATUS_LABEL: Record<string, string> = {
  DRAFT:          'CC Borrador',
  ISSUED:         'CC Emitida',
  PARTIALLY_PAID: 'Pago parcial',
  PAID:           'Cobrada',
  VOID:           'CC Anulada',
};

const INVOICE_STATUS_VARIANT: Record<string, 'secondary' | 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT:          'secondary',
  ISSUED:         'info',
  PARTIALLY_PAID: 'warning',
  PAID:           'success',
  VOID:           'danger',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkOrderHeaderProps {
  workOrder: WorkOrder;
  onCreateInvoice: () => void;
  onViewInvoice: () => void;
  onEdit?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkOrderHeader({ workOrder, onCreateInvoice, onViewInvoice, onEdit }: WorkOrderHeaderProps) {
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

        {/* Edit — only for editable statuses */}
        {EDITABLE_STATUSES.includes(status) && onEdit && (
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        )}

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
          <div className="flex items-center gap-2">
            <Badge variant={INVOICE_STATUS_VARIANT[invoice.status] ?? 'secondary'}>
              {INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}
            </Badge>
            <Button size="sm" variant="outline" onClick={onViewInvoice}>
              Ver CC
            </Button>
          </div>
        )}

        {/* Acta técnica PDF — visible cuando existe el acta */}
        {workOrder.serviceRecord && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => downloadServiceRecordPdf(workOrder.id, number)}
          >
            <FileDown className="h-3.5 w-3.5" />
            Descargar Acta
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
