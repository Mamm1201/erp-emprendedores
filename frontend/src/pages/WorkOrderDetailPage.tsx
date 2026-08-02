import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useWorkOrder } from '@/hooks/use-work-orders';
import { useExpenses }  from '@/hooks/use-expenses';
import { WorkOrderHeader }    from '@/components/work-orders/WorkOrderHeader';
import { WorkOrderInfoCard }  from '@/components/work-orders/WorkOrderInfoCard';
import { WorkOrderItemsCard } from '@/components/work-orders/WorkOrderItemsCard';
import { ResourceUtilizationsCard } from '@/components/work-orders/ResourceUtilizationsCard';
import { TechniciansCard } from '@/components/work-orders/TechniciansCard';
import { ServiceRecordCard }  from '@/components/work-orders/ServiceRecordCard';
import { BillingPreparationCard } from '@/components/work-orders/BillingPreparationCard';
import { ExpensesCard }       from '@/components/work-orders/ExpensesCard';
import { CostSummaryCard }    from '@/components/work-orders/CostSummaryCard';
import { TimelineCard }       from '@/components/work-orders/TimelineCard';
import { InvoiceSideCard }    from '@/components/work-orders/InvoiceSideCard';
import { WorkOrderEditModal } from '@/components/work-orders/WorkOrderEditModal';
import { EvidencesCard }       from '@/components/work-orders/EvidencesCard';

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded bg-[hsl(var(--muted))]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 rounded-lg bg-[hsl(var(--muted))]" />
          <div className="h-64 rounded-lg bg-[hsl(var(--muted))]" />
        </div>
        <div className="space-y-6">
          <div className="h-40 rounded-lg bg-[hsl(var(--muted))]" />
          <div className="h-32 rounded-lg bg-[hsl(var(--muted))]" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WorkOrderDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const { data: workOrder, isLoading, isError } = useWorkOrder(id ?? null);
  const { data: expenses = [] } = useExpenses(id ?? null);

  function handleCreateInvoice() {
    navigate(`/cuentas-cobro/nueva?workOrderId=${id}`);
  }

  function handleViewInvoice() {
    if (workOrder?.invoice) {
      navigate(`/cuentas-cobro/${workOrder.invoice.id}`);
    }
  }

  if (isLoading) return <DetailSkeleton />;

  if (isError || !workOrder) {
    return (
      <div className="p-6">
        <p className="text-sm text-[hsl(var(--destructive))]">
          No se pudo cargar la orden de trabajo.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">

      <WorkOrderHeader
        workOrder={workOrder}
        onCreateInvoice={handleCreateInvoice}
        onViewInvoice={handleViewInvoice}
        onEdit={() => setEditOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <WorkOrderInfoCard workOrder={workOrder} />
          <WorkOrderItemsCard workOrder={workOrder} />
          <ResourceUtilizationsCard
            workOrderId={workOrder.id}
            workOrderStatus={workOrder.status}
          />
          <EvidencesCard workOrderId={workOrder.id} />
          <TechniciansCard
            workOrderId={workOrder.id}
            workOrderStatus={workOrder.status}
            technicians={workOrder.technicians ?? []}
          />
          <ServiceRecordCard workOrderId={workOrder.id} />
          <BillingPreparationCard workOrder={workOrder} />
          <ExpensesCard workOrderId={workOrder.id} workOrderStatus={workOrder.status} />
        </div>

        {/* Lateral column (1/3) */}
        <div className="space-y-6">
          <TimelineCard workOrder={workOrder} />
          <InvoiceSideCard
            workOrder={workOrder}
            onCreateInvoice={handleCreateInvoice}
            onViewInvoice={handleViewInvoice}
          />
          <CostSummaryCard workOrder={workOrder} expenses={expenses} />
        </div>
      </div>

      <WorkOrderEditModal
        workOrder={workOrder}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
