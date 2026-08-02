import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { ClientFinance, Receivable } from '@/lib/types';

// Módulo Finance (solo lectura). Hooks separados de use-invoices por dominio.

export function useReceivable() {
  return useQuery({
    queryKey: ['finance-receivable'],
    queryFn: () => api.get<Receivable>('/finance/receivable'),
    staleTime: 2 * 60 * 1000,
  });
}

export function useClientFinance(clientId: string | null) {
  return useQuery({
    queryKey: ['finance-client', clientId],
    queryFn: () => api.get<ClientFinance>(`/finance/clients/${clientId}`),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });
}
