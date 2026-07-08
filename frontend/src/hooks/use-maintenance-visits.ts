import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MaintenanceVisit } from '@/lib/types';

export interface VisitFormData {
  scheduledDate: string;
  windowEnd?: string;
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

export function useCreateMaintenanceVisit(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VisitFormData) =>
      api.post<MaintenanceVisit>(`/maintenance-plans/${planId}/visits`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-visits', planId] });
    },
  });
}

export function useGenerateWorkOrder(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) =>
      api.post<{ workOrder: { id: string; number: string; status: string } }>(
        `/maintenance-plans/${planId}/visits/${visitId}/generate-work-order`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-visits', planId] });
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCancelVisit(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) =>
      api.patch<MaintenanceVisit>(
        `/maintenance-plans/${planId}/visits/${visitId}/cancel`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-visits', planId] });
    },
  });
}

export function useDeleteVisit(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) =>
      api.delete<{ id: string; deleted: boolean }>(
        `/maintenance-plans/${planId}/visits/${visitId}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-visits', planId] });
    },
  });
}
