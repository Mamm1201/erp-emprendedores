import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { UpcomingVisitsResponse } from '@/lib/types';

export function useUpcomingVisits(days: number = 30) {
  return useQuery({
    queryKey: ['maintenance-plans', 'upcoming', days],
    queryFn: () => api.get<UpcomingVisitsResponse>(`/maintenance-plans/upcoming?days=${days}`),
    staleTime: 5 * 60 * 1000,
  });
}
