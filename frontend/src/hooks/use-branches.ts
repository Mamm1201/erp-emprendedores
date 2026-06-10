import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Branch, PaginatedResponse } from '@/lib/types';

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
