import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Receivable } from '@/lib/types';

// Módulo Finance (solo lectura). Hooks separados de use-invoices por dominio.

export function useReceivable() {
  return useQuery({
    queryKey: ['finance-receivable'],
    queryFn: () => api.get<Receivable>('/finance/receivable'),
    staleTime: 2 * 60 * 1000,
  });
}
