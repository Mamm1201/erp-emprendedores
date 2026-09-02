import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Activity, ActivityStatus, ActivityType, PaginatedResponse } from '@/lib/types';

export interface ActivityFormData {
  opportunityId?: string;
  contactId?: string;
  type: ActivityType;
  status?: ActivityStatus;
  occurredAt: string;
  summary: string;
  outcome?: string;
}

// Sin filtro server-side por opportunityId (no existe en backend) — se trae
// toda la Account y se filtra en el componente que lo necesite (ver
// OpportunityDetailPage). Aceptado explícitamente en el contrato F1.9.
export function useActivities(accountId: string | null) {
  return useQuery({
    queryKey: ['activities', accountId],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Activity>>(
        `/accounts/${accountId}/activities?limit=100`,
      );
      return res.data;
    },
    enabled: !!accountId,
    staleTime: 60 * 1000,
  });
}

export function useCreateActivity(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ActivityFormData) =>
      api.post<Activity>(`/accounts/${accountId}/activities`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities', accountId] }),
  });
}
