import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MaintenanceVisit, NotAttendedReason } from '@/lib/types';

// El periodo es inmutable: solo se planifica la fecha tentativa.
export interface VisitUpdateData {
  scheduledDate?: string;
  notes?: string;
}

export function useMaintenanceVisits(planId: string) {
  return useQuery({
    queryKey: ['maintenance-visits', planId],
    queryFn: () =>
      api.get<{ data: MaintenanceVisit[] }>(`/maintenance-plans/${planId}/visits`),
    enabled: !!planId,
    staleTime: 60 * 1000,
  });
}

function useVisitMutation<TVars, TData>(
  planId: string,
  request: (vars: TVars) => Promise<TData>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-visits', planId] });
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateVisit(planId: string) {
  return useVisitMutation(planId, ({ visitId, data }: { visitId: string; data: VisitUpdateData }) =>
    api.patch<MaintenanceVisit>(`/maintenance-plans/${planId}/visits/${visitId}`, data),
  );
}

export function useGenerateWorkOrder(planId: string) {
  return useVisitMutation(planId, (visitId: string) =>
    api.post<{ workOrder: { id: string; number: string; status: string } }>(
      `/maintenance-plans/${planId}/visits/${visitId}/generate-work-order`,
      {},
    ),
  );
}

// Cerrar sin ejecucion: todos los equipos deben estar NOT_ATTENDED.
export function useCloseVisitWithoutExecution(planId: string) {
  return useVisitMutation(planId, (visitId: string) =>
    api.post<MaintenanceVisit>(
      `/maintenance-plans/${planId}/visits/${visitId}/close-without-execution`,
      {},
    ),
  );
}

// Cancelar = la obligacion desaparece (no es cerrar una visita no ejecutada).
export function useCancelVisit(planId: string) {
  return useVisitMutation(planId, ({ visitId, reason }: { visitId: string; reason: string }) =>
    api.patch<MaintenanceVisit>(`/maintenance-plans/${planId}/visits/${visitId}/cancel`, {
      reason,
    }),
  );
}

export function useDeleteVisit(planId: string) {
  return useVisitMutation(planId, (visitId: string) =>
    api.delete<{ id: string; deleted: boolean }>(`/maintenance-plans/${planId}/visits/${visitId}`),
  );
}

export function useMarkEquipmentNotAttended(planId: string) {
  return useVisitMutation(
    planId,
    ({
      visitId,
      equipmentId,
      reason,
      note,
    }: {
      visitId: string;
      equipmentId: string;
      reason: NotAttendedReason;
      note: string;
    }) =>
      api.patch<MaintenanceVisit>(
        `/maintenance-plans/${planId}/visits/${visitId}/equipment/${equipmentId}/not-attended`,
        { reason, note },
      ),
  );
}

export function useRevertEquipmentToPending(planId: string) {
  return useVisitMutation(planId, ({ visitId, equipmentId }: { visitId: string; equipmentId: string }) =>
    api.patch<MaintenanceVisit>(
      `/maintenance-plans/${planId}/visits/${visitId}/equipment/${equipmentId}/pending`,
      {},
    ),
  );
}

export function useSetEarlyExecutionNote(planId: string) {
  return useVisitMutation(
    planId,
    ({ visitId, equipmentId, note }: { visitId: string; equipmentId: string; note: string }) =>
      api.patch<MaintenanceVisit>(
        `/maintenance-plans/${planId}/visits/${visitId}/equipment/${equipmentId}/early-note`,
        { note },
      ),
  );
}
