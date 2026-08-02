import { useEffect, useState } from 'react';
import { Users, AlertTriangle } from 'lucide-react';

import { useTechnicians } from '@/hooks/use-users';
import { useSetWorkOrderTechnicians } from '@/hooks/use-work-orders';
import type { WorkOrderStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TechniciansCardProps {
  workOrderId: string;
  workOrderStatus: WorkOrderStatus;
  technicians: { id: string; name: string }[];
}

// Ejecutores reales de la intervención — distinto de "Técnico asignado"
// (responsable en planeación, WorkOrderInfoCard). La OT es la fuente de
// verdad; el Acta/PDF solo leen esta relación. Opcional: no bloquea el cierre
// de la OT, solo advierte cuando está COMPLETED sin ejecutores registrados.

export function TechniciansCard({ workOrderId, workOrderStatus, technicians }: TechniciansCardProps) {
  const { data: allTechnicians = [] } = useTechnicians();
  const setTechnicians = useSetWorkOrderTechnicians();

  const [selected, setSelected] = useState<Set<string>>(new Set(technicians.map((t) => t.id)));

  useEffect(() => {
    setSelected(new Set(technicians.map((t) => t.id)));
  }, [technicians]);

  const currentIds = technicians.map((t) => t.id).sort().join(',');
  const selectedIds = [...selected].sort();
  const isDirty = selectedIds.join(',') !== currentIds;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    setTechnicians.mutate({ id: workOrderId, technicianIds: selectedIds });
  }

  const showEmptyWarning = workOrderStatus === 'COMPLETED' && technicians.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Ejecutores
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showEmptyWarning && (
          <p className="flex items-center gap-1.5 text-xs text-amber-signal">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            OT completada sin ejecutores registrados · verificar
          </p>
        )}

        {allTechnicians.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No hay técnicos registrados.</p>
        ) : (
          <div className="space-y-1.5">
            {allTechnicians.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggle(t.id)}
                  className="rounded"
                />
                {t.name}
              </label>
            ))}
          </div>
        )}

        {setTechnicians.error && (
          <p className="text-xs text-[hsl(var(--destructive))]">{setTechnicians.error.message}</p>
        )}

        {isDirty && (
          <Button size="sm" onClick={handleSave} disabled={setTechnicians.isPending}>
            {setTechnicians.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
