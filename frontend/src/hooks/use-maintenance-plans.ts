import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MaintenancePlan, MaintenanceFrequency, PaginatedResponse } from '@/lib/types';

export interface MaintenancePlanFormData {
  contractId: string;
  branchId: string;
  frequency: MaintenanceFrequency;
  // Mes ancla del ciclo (el backend lo normaliza al dia 1).
  firstPeriodStart: string;
  isActive?: boolean;
  notes?: string;
}

interface PlanFilters {
  contractId?: string;
  isActive?: boolean;
  page?: number;
}

export function useMaintenancePlans(filters: PlanFilters = {}) {
  const params = new URLSearchParams({ page: String(filters.page ?? 1) });
  if (filters.contractId) params.set('contractId', filters.contractId);
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));

  return useQuery({
    queryKey: ['maintenance-plans', 'list', filters],
    queryFn: () => api.get<PaginatedResponse<MaintenancePlan>>(`/maintenance-plans?${params}`),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

// Un plan por ID (GET /maintenance-plans/:id) — no depende de la paginacion
// del listado.
export function useMaintenancePlan(id: string | null) {
  return useQuery({
    queryKey: ['maintenance-plans', 'detail', id],
    queryFn: () => api.get<MaintenancePlan>(`/maintenance-plans/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateMaintenancePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MaintenancePlanFormData) =>
      api.post<MaintenancePlan>('/maintenance-plans', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-plans'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
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

// Genera las visitas faltantes del plan por periodo (idempotente).
export function useSyncPlanVisits(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ planId: string; created: number }>(`/maintenance-plans/${planId}/sync-visits`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-visits', planId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
