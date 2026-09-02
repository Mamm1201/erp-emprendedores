import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Service } from '@/lib/types';

// Catálogo read-only (GET /services) — sin paginación, sin CRUD en F1.9.
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => api.get<Service[]>('/services'),
    staleTime: 10 * 60 * 1000,
  });
}
