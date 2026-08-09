import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Quotation, QuotationStatus, PaginatedResponse } from '@/lib/types';

export interface QuotationItemFormData {
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
  lineOrder?: number;
}

export interface QuotationFormData {
  clientId: string;
  branchId?: string;
  validUntil?: string;
  notes?: string;
  terms?: string;
  retentionsApplied?: boolean;
  items: QuotationItemFormData[];
}

interface QuotationFilters {
  search?: string;
  status?: QuotationStatus | '';
  page?: number;
}

export function useQuotations(filters: QuotationFilters = {}) {
  const params = new URLSearchParams({ page: String(filters.page ?? 1) });
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.status) params.set('status', filters.status);

  return useQuery({
    queryKey: ['quotations', filters],
    queryFn: () => api.get<PaginatedResponse<Quotation>>(`/quotations?${params}`),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useQuotation(id: string | null) {
  return useQuery({
    queryKey: ['quotations', id],
    queryFn: () => api.get<Quotation>(`/quotations/${id}`),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: QuotationFormData) => api.post<Quotation>('/quotations', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
  });
}

export function useUpdateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<QuotationFormData> }) =>
      api.patch<Quotation>(`/quotations/${id}`, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      qc.invalidateQueries({ queryKey: ['quotations', vars.id] });
    },
  });
}

export function useUpdateQuotationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: QuotationStatus; notes?: string }) =>
      api.patch<Quotation>(`/quotations/${id}/status`, { status, notes }),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      qc.invalidateQueries({ queryKey: ['quotations', vars.id] });
    },
  });
}

export function useDeleteQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/quotations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
  });
}
