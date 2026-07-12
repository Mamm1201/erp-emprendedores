import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AssociatedEquipment } from '@/lib/types';

export function useContractEquipment(contractId: string | null) {
  return useQuery({
    queryKey: ['maintenance-contracts', 'equipment', contractId],
    queryFn: () =>
      api.get<AssociatedEquipment[]>(`/maintenance-contracts/${contractId}/equipment`),
    enabled: !!contractId,
    staleTime: 60 * 1000,
  });
}

export function useAttachContractEquipment(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (equipmentId: string) =>
      api.post<AssociatedEquipment>(`/maintenance-contracts/${contractId}/equipment`, {
        equipmentId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-contracts', 'equipment', contractId] });
    },
  });
}

export function useDetachContractEquipment(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (equipmentId: string) =>
      api.delete<{ contractId: string; equipmentId: string; removed: boolean }>(
        `/maintenance-contracts/${contractId}/equipment/${equipmentId}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-contracts', 'equipment', contractId] });
    },
  });
}
