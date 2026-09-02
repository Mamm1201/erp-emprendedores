import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Opportunity,
  OpportunityPriority,
  OpportunityStage,
  LeadSource,
  Quotation,
  PaginatedResponse,
} from '@/lib/types';

export interface OpportunityFormData {
  primaryContactId?: string;
  title: string;
  detectedNeed?: string;
  priority?: OpportunityPriority;
  source: LeadSource;
  probability?: number;
  potentialValue?: number;
}

export interface GenerateQuotationFormData {
  validUntil?: string;
  notes?: string;
  terms?: string;
  retentionsApplied?: boolean;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    taxRate?: number;
    lineOrder?: number;
  }[];
}

export function useOpportunities(accountId: string | null) {
  return useQuery({
    queryKey: ['opportunities', accountId],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Opportunity>>(
        `/accounts/${accountId}/opportunities?limit=100`,
      );
      return res.data;
    },
    enabled: !!accountId,
    staleTime: 60 * 1000,
  });
}

export function useOpportunity(accountId: string | null, id: string | null) {
  return useQuery({
    queryKey: ['opportunity', accountId, id],
    queryFn: () => api.get<Opportunity>(`/accounts/${accountId}/opportunities/${id}`),
    enabled: !!accountId && !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateOpportunity(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OpportunityFormData) =>
      api.post<Opportunity>(`/accounts/${accountId}/opportunities`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities', accountId] }),
  });
}

export function useUpdateOpportunity(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OpportunityFormData> }) =>
      api.patch<Opportunity>(`/accounts/${accountId}/opportunities/${id}`, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['opportunities', accountId] });
      qc.invalidateQueries({ queryKey: ['opportunity', accountId, vars.id] });
    },
  });
}

export function useUpdateOpportunityStage(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: OpportunityStage }) =>
      api.patch<Opportunity>(`/accounts/${accountId}/opportunities/${id}/stage`, { stage }),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['opportunities', accountId] });
      qc.invalidateQueries({ queryKey: ['opportunity', accountId, vars.id] });
    },
  });
}

export function useLinkService(accountId: string, opportunityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) =>
      api.post<Opportunity>(
        `/accounts/${accountId}/opportunities/${opportunityId}/services/${serviceId}`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunity', accountId, opportunityId] });
      qc.invalidateQueries({ queryKey: ['opportunities', accountId] });
    },
  });
}

export function useUnlinkService(accountId: string, opportunityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) =>
      api.delete<Opportunity>(
        `/accounts/${accountId}/opportunities/${opportunityId}/services/${serviceId}`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunity', accountId, opportunityId] });
      qc.invalidateQueries({ queryKey: ['opportunities', accountId] });
    },
  });
}

export function useGenerateQuotation(accountId: string, opportunityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateQuotationFormData) =>
      api.post<Quotation>(
        `/accounts/${accountId}/opportunities/${opportunityId}/quotations`,
        data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunity', accountId, opportunityId] });
      qc.invalidateQueries({ queryKey: ['opportunities', accountId] });
      qc.invalidateQueries({ queryKey: ['quotationsByOpportunity', opportunityId] });
    },
  });
}

// Hook delgado sobre GET /quotations?opportunityId=X (trazabilidad cerrada en
// el bloque anterior, commit 368ab86). No toca ni importa nada del módulo
// Quotations — es una llamada directa e independiente a ese mismo endpoint.
export function useQuotationsByOpportunity(opportunityId: string | null) {
  return useQuery({
    queryKey: ['quotationsByOpportunity', opportunityId],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Quotation>>(
        `/quotations?opportunityId=${opportunityId}`,
      );
      return res.data;
    },
    enabled: !!opportunityId,
    staleTime: 30 * 1000,
  });
}
