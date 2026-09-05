import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Person, PersonProfile, RelationshipType } from '@/lib/types';

export interface PersonsQuery {
  search?: string;
  profile?: PersonProfile;
  relationshipType?: RelationshipType;
}

interface PersonListResponse {
  data: Person[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreatePersonData {
  fullName: string;
  email?: string;
  phone?: string;
  profile: PersonProfile;
  relationshipType: RelationshipType;
  notes?: string;
}

export type UpdatePersonData = Partial<CreatePersonData>;

export function usePersons(query: PersonsQuery = {}) {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.profile) params.set('profile', query.profile);
  if (query.relationshipType) params.set('relationshipType', query.relationshipType);
  params.set('limit', '100');

  const qs = params.toString();
  return useQuery({
    queryKey: ['persons', query],
    queryFn: () => api.get<PersonListResponse>(`/persons${qs ? `?${qs}` : ''}`),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function usePerson(id: string) {
  return useQuery({
    queryKey: ['persons', id],
    queryFn: () => api.get<Person>(`/persons/${id}`),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePersonData) => api.post<Person>('/persons', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons'] }),
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonData }) =>
      api.patch<Person>(`/persons/${id}`, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['persons'] });
      qc.invalidateQueries({ queryKey: ['persons', vars.id] });
    },
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string; deletedAt: string }>(`/persons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons'] }),
  });
}
