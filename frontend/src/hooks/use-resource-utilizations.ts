import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  ResourceUtilization,
  ResourceCategory,
  ResourceOrigin,
} from '@/lib/types';

export interface ResourceUtilizationFormData {
  resourceName: string;
  category: ResourceCategory;
  quantity: number;
  unit: string;
  origin: ResourceOrigin;
  observation?: string;
}

const base = (workOrderId: string) =>
  `/work-orders/${workOrderId}/resource-utilizations`;

export function useResourceUtilizations(workOrderId: string | null) {
  return useQuery({
    queryKey: ['resource-utilizations', workOrderId],
    queryFn: () => api.get<ResourceUtilization[]>(base(workOrderId!)),
    enabled: !!workOrderId,
    staleTime: 30 * 1000,
  });
}

export function useCreateResourceUtilization(workOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ResourceUtilizationFormData) =>
      api.post<ResourceUtilization>(base(workOrderId), data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['resource-utilizations', workOrderId] }),
  });
}

export function useUpdateResourceUtilization(workOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ResourceUtilizationFormData>;
    }) => api.patch<ResourceUtilization>(`${base(workOrderId)}/${id}`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['resource-utilizations', workOrderId] }),
  });
}

export function useDeleteResourceUtilization(workOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string }>(`${base(workOrderId)}/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['resource-utilizations', workOrderId] }),
  });
}
