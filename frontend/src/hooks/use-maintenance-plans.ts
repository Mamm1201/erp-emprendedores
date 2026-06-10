import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MaintenancePlan, MaintenanceFrequency, PaginatedResponse } from '@/lib/types';

export interface MaintenancePlanFormData {
  clientId: string;
  branchId?: string;
  frequency: MaintenanceFrequency;
  contractStartDate: string;
  contractEndDate?: string;
  nextVisitDate: string;
  isActive?: boolean;
  notes?: string;
}

interface PlanFilters {
  clientId?: string;
  isActive?: boolean;
  page?: number;
}

export function useMaintenancePlans(filters: PlanFilters = {}) {
  const params = new URLSearchParams({ page: String(filters.page ?? 1) });
  if (filters.clientId) params.set('clientId', filters.clientId);
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));

  return useQuery({
    queryKey: ['maintenance-plans', 'list', filters],
    queryFn: () => api.get<PaginatedResponse<MaintenancePlan>>(`/maintenance-plans?${params}`),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useCreateMaintenancePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MaintenancePlanFormData) =>
      api.post<MaintenancePlan>('/maintenance-plans', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-plans'] });
    },
  });
}

export function useUpdateMaintenancePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaintenancePlanFormData> }) =>
      api.patch<MaintenancePlan>(`/maintenance-plans/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-plans'] });
    },
  });
}
