import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  MaintenanceContract,
  ContractStatus,
  BillingCycle,
  ServiceHoursLevel,
  PaginatedResponse,
} from '@/lib/types';

export interface ContractFormData {
  clientId: string;
  billingCycle: BillingCycle;
  value: number;
  startDate: string;
  endDate: string;
  quotationId?: string;
  signedById?: string;
  signedAt?: string;
  correctiveIncluded?: boolean;
  partsIncluded?: boolean;
  transportIncluded?: boolean;
  serviceHours?: ServiceHoursLevel;
  slaHoursCritical?: number;
  slaHoursHigh?: number;
  slaHoursMedium?: number;
  slaHoursLow?: number;
  notes?: string;
}

export interface ContractUpdateData extends Partial<Omit<ContractFormData, 'clientId'>> {
  status?: ContractStatus;
}

interface ContractFilters {
  clientId?: string;
  status?: ContractStatus;
  search?: string;
  page?: number;
}

export function useMaintenanceContracts(filters: ContractFilters = {}) {
  const params = new URLSearchParams({ page: String(filters.page ?? 1) });
  if (filters.clientId) params.set('clientId', filters.clientId);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  return useQuery({
    queryKey: ['maintenance-contracts', 'list', filters],
    queryFn: () =>
      api.get<PaginatedResponse<MaintenanceContract>>(`/maintenance-contracts?${params}`),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useMaintenanceContract(id: string) {
  return useQuery({
    queryKey: ['maintenance-contracts', 'detail', id],
    queryFn: () => api.get<MaintenanceContract>(`/maintenance-contracts/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateMaintenanceContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContractFormData) =>
      api.post<MaintenanceContract>('/maintenance-contracts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-contracts'] });
    },
  });
}

export function useUpdateMaintenanceContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContractUpdateData }) =>
      api.patch<MaintenanceContract>(`/maintenance-contracts/${id}`, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ['maintenance-contracts'] });
      qc.invalidateQueries({ queryKey: ['maintenance-contracts', 'detail', id] });
    },
  });
}

export function useDeleteMaintenanceContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string; number: string; deletedAt: string }>(
        `/maintenance-contracts/${id}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-contracts'] });
    },
  });
}
