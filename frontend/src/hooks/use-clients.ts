import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Client, ClientType, PaginatedResponse } from '@/lib/types';

export interface ClientFormData {
  legalName: string;
  tradeName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  notes?: string;
  type?: ClientType;
  isIncomeTaxRetentionAgent?: boolean;
  isIcaRetentionAgent?: boolean;
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => api.get<Client>(`/clients/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useClients(search = '', page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  if (search.trim()) params.set('search', search.trim());

  return useQuery({
    queryKey: ['clients', search, page],
    queryFn: () => api.get<PaginatedResponse<Client>>(`/clients?${params}`),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClientFormData) => api.post<Client>('/clients', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientFormData> }) =>
      api.patch<Client>(`/clients/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string; deletedAt: string }>(`/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
