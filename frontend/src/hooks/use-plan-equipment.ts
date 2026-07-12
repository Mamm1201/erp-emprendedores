import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AssociatedEquipment } from '@/lib/types';

export function usePlanEquipment(planId: string | null) {
  return useQuery({
    queryKey: ['maintenance-plans', 'equipment', planId],
    queryFn: () => api.get<AssociatedEquipment[]>(`/maintenance-plans/${planId}/equipment`),
    enabled: !!planId,
    staleTime: 60 * 1000,
  });
}

export function useAttachPlanEquipment(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (equipmentId: string) =>
      api.post<AssociatedEquipment>(`/maintenance-plans/${planId}/equipment`, { equipmentId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-plans', 'equipment', planId] });
    },
  });
}

export function useDetachPlanEquipment(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (equipmentId: string) =>
      api.delete<{ planId: string; equipmentId: string; removed: boolean }>(
        `/maintenance-plans/${planId}/equipment/${equipmentId}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-plans', 'equipment', planId] });
    },
  });
}
