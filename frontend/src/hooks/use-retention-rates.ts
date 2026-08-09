import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RetentionRate } from '@/lib/types';

// Tarifas vigentes de retención (RETE FUENTE / RETE ICA). Solo lectura — el
// backend es la única fuente de verdad de porcentajes, mínimos y vigencias.
export function useRetentionRates() {
  return useQuery({
    queryKey: ['retention-rates', 'active'],
    queryFn: () => api.get<RetentionRate[]>('/retention-rates?active=true'),
    staleTime: 5 * 60 * 1000,
  });
}
