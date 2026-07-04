import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Branch, PaginatedResponse } from '@/lib/types';

export interface BranchFormData {
  name: string;
  contactName?: string;
  contactPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  department?: string;
  isPrimary?: boolean;
  notes?: string;
}

export function useBranches(clientId: string | null) {
  return useQuery({
    queryKey: ['branches', clientId],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Branch>>(
        `/clients/${clientId}/branches?limit=100`,
      );
      return res.data;
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBranch(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BranchFormData) =>
      api.post<Branch>(`/clients/${clientId}/branches`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches', clientId] }),
  });
}

export function useUpdateBranch(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BranchFormData> }) =>
      api.patch<Branch>(`/clients/${clientId}/branches/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches', clientId] }),
  });
}

export function useDeleteBranch(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string; clientId: string; deletedAt: string }>(
        `/clients/${clientId}/branches/${id}`,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches', clientId] }),
  });
}
