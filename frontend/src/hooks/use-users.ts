import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User, UserRole, Technician } from '@/lib/types';

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ChangePasswordData {
  currentPassword?: string;
  newPassword: string;
}

export interface UsersQuery {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export function useUsers(query: UsersQuery = {}) {
  const params = new URLSearchParams();
  if (query.role) params.set('role', query.role);
  if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
  if (query.search?.trim()) params.set('search', query.search.trim());

  const qs = params.toString();
  return useQuery({
    queryKey: ['users', query],
    queryFn: () => api.get<User[]>(`/users${qs ? `?${qs}` : ''}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTechnicians() {
  return useQuery({
    queryKey: ['users', 'technicians'],
    queryFn: () => api.get<Technician[]>('/users/technicians'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api.get<User>(`/users/${id}`),
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserData) => api.post<User>('/users', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      api.patch<User>(`/users/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<User>(`/users/${id}/deactivate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangePasswordData }) =>
      api.patch<void>(`/users/${id}/password`, data),
  });
}
