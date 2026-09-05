import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Accreditation } from '@/lib/types';

export interface IssueAccreditationData {
  displayRole: string;
  validFrom?: string;
  validUntil?: string;
}

export interface ReissueAccreditationData extends IssueAccreditationData {
  previousRevokedReason?: string;
}

export function useAccreditations(personId: string) {
  return useQuery({
    queryKey: ['persons', personId, 'accreditations'],
    queryFn: () => api.get<Accreditation[]>(`/persons/${personId}/accreditations`),
    enabled: Boolean(personId),
    staleTime: 30 * 1000,
  });
}

export function useIssueAccreditation(personId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IssueAccreditationData) =>
      api.post<Accreditation>(`/persons/${personId}/accreditations`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['persons', personId, 'accreditations'] }),
  });
}

export function useRevokeAccreditation(personId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, revokedReason }: { id: string; revokedReason?: string }) =>
      api.patch<Accreditation>(`/persons/${personId}/accreditations/${id}/revoke`, {
        revokedReason,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['persons', personId, 'accreditations'] }),
  });
}

export function useReissueAccreditation(personId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReissueAccreditationData) =>
      api.post<Accreditation>(`/persons/${personId}/accreditations/reissue`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['persons', personId, 'accreditations'] }),
  });
}
