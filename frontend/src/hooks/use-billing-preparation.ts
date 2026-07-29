import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BillingPreparation, BillingResolution } from '@/lib/types';

const key = (workOrderId: string) => ['billing-preparation', workOrderId];

/** GET por OT. 404 = aún no hay preparación (se maneja en el componente). */
export function useBillingPreparation(
  workOrderId: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: key(workOrderId ?? ''),
    queryFn: () =>
      api.get<BillingPreparation>(
        `/billing-preparations/by-work-order/${workOrderId}`,
      ),
    enabled: !!workOrderId && enabled,
    retry: false,
    staleTime: 15 * 1000,
  });
}

export function useOpenBillingPreparation(workOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<BillingPreparation>('/billing-preparations', { workOrderId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(workOrderId) }),
  });
}

export interface SetResolutionInput {
  utilizationId: string;
  resolution: BillingResolution;
  unitPrice?: number;
  discountAmount?: number;
  taxRate?: number;
}

export function useSetResolution(preparationId: string, workOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetResolutionInput) =>
      api.post<BillingPreparation>(
        `/billing-preparations/${preparationId}/resolutions`,
        data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(workOrderId) }),
  });
}

export function useConfirmBillingPreparation(
  preparationId: string,
  workOrderId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.patch<BillingPreparation>(
        `/billing-preparations/${preparationId}/confirm`,
        {},
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(workOrderId) }),
  });
}

export function useCreateInvoiceFromPreparation(workOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      preparationId: string;
      dueDate: string;
      notes?: string;
    }) => api.post<{ id: string }>('/invoices/from-preparation', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(workOrderId) });
      qc.invalidateQueries({ queryKey: ['work-orders', workOrderId] });
    },
  });
}
