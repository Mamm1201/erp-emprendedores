import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Account,
  AccountStatus,
  InstitutionType,
  LeadSource,
  SizePotential,
  PaginatedResponse,
} from '@/lib/types';

export interface AccountFormData {
  legalName: string;
  nit?: string;
  city: string;
  institutionType: InstitutionType;
  sizePotential?: SizePotential;
  website?: string;
  status?: AccountStatus;
  source: LeadSource;
  notes?: string;
}

export function useAccounts(search = '', page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  if (search.trim()) params.set('search', search.trim());

  return useQuery({
    queryKey: ['accounts', search, page],
    queryFn: () => api.get<PaginatedResponse<Account>>(`/accounts?${params}`),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useAccount(id: string | null) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: () => api.get<Account>(`/accounts/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AccountFormData) => api.post<Account>('/accounts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccountFormData> }) =>
      api.patch<Account>(`/accounts/${id}`, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['account', vars.id] });
    },
  });
}
