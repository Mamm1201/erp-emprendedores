import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Contact, ContactRole, InfluenceLevel, PaginatedResponse } from '@/lib/types';

export interface ContactFormData {
  branchId?: string;
  name: string;
  role: ContactRole;
  area?: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  influenceLevel?: InfluenceLevel;
  notes?: string;
}

export function useContacts(accountId: string | null) {
  return useQuery({
    queryKey: ['contacts', accountId],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Contact>>(
        `/accounts/${accountId}/contacts?limit=100`,
      );
      return res.data;
    },
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateContact(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContactFormData) =>
      api.post<Contact>(`/accounts/${accountId}/contacts`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts', accountId] }),
  });
}

export function useUpdateContact(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactFormData> }) =>
      api.patch<Contact>(`/accounts/${accountId}/contacts/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts', accountId] }),
  });
}
