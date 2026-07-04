import type { WorkOrder, WorkOrderStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STATUS_STEP: Record<WorkOrderStatus, number> = {
  DRAFT:       0,
  SCHEDULED:   1,
  IN_PROGRESS: 2,
  COMPLETED:   3,
  CANCELLED:   -1,
};

const TIMELINE_STEPS: { key: WorkOrderStatus; label: string; dateKey: keyof WorkOrder }[] = [
  { key: 'DRAFT',       label: 'Creada',     dateKey: 'createdAt'   },
  { key: 'SCHEDULED',   label: 'Programada', dateKey: 'scheduledAt' },
  { key: 'IN_PROGRESS', label: 'Iniciada',   dateKey: 'startedAt'   },
  { key: 'COMPLETED',   label: 'Completada', dateKey: 'completedAt' },
];

interface TimelineCardProps {
  workOrder: WorkOrder;
}

export function TimelineCard({ workOrder }: TimelineCardProps) {
  const currentStep = STATUS_STEP[workOrder.status];
  const cancelled   = workOrder.status === 'CANCELLED';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          Línea de tiempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {TIMELINE_STEPS.map((step, i) => {
            const done    = !cancelled && currentStep >= i;
            const current = !cancelled && currentStep === i;
            const value   = workOrder[step.dateKey] as string | null;

            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={cn(
                      'h-2.5 w-2.5 rounded-full border-2 mt-1',
                      done
                        ? 'bg-node-teal border-node-teal'
                        : 'bg-transparent border-[hsl(var(--border))]',
                      current && 'ring-2 ring-node-teal/30',
                    )}
                  />
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={cn(
                        'w-px h-6 mt-1',
                        done ? 'bg-node-teal/40' : 'bg-[hsl(var(--border))]',
                      )}
                    />
                  )}
                </div>
                <div>
                  <p className={cn('text-sm', done ? 'font-medium' : 'text-[hsl(var(--muted-foreground))]')}>
                    {step.label}
                  </p>
                  {value && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {new Date(value).toLocaleDateString('es-CO', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {cancelled && (
            <div className="flex items-center gap-3 mt-1">
              <div className="h-2.5 w-2.5 rounded-full bg-alert-red border-2 border-alert-red shrink-0 mt-1" />
              <p className="text-sm font-medium text-alert-red">Cancelada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
