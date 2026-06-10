import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { WorkOrder, WorkOrderStatus, PaginatedResponse } from '@/lib/types';

export interface WorkOrderFormData {
  clientId: string;
  branchId?: string;
  title: string;
  description?: string;
  scheduledAt?: string;
}

interface WorkOrderFilters {
  search?: string;
  status?: WorkOrderStatus | '';
  page?: number;
}

export function useWorkOrders(filters: WorkOrderFilters = {}) {
  const params = new URLSearchParams({ page: String(filters.page ?? 1) });
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.status) params.set('status', filters.status);

  return useQuery({
    queryKey: ['work-orders', filters],
    queryFn: () => api.get<PaginatedResponse<WorkOrder>>(`/work-orders?${params}`),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useCreateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WorkOrderFormData) => api.post<WorkOrder>('/work-orders', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work-orders'] }),
  });
}

export function useUpdateWorkOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkOrderStatus }) =>
      api.patch<WorkOrder>(`/work-orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      qc.invalidateQueries({ queryKey: ['maintenance-plans'] });
    },
  });
}

export function useDeleteWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/work-orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work-orders'] }),
  });
}
