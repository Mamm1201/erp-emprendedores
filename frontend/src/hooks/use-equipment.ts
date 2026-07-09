import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Equipment, EquipmentType, EquipmentStatus, PaginatedResponse } from '@/lib/types';

export interface EquipmentFormData {
  type: EquipmentType;
  brand?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
  location?: string;
  notes?: string;
  status?: EquipmentStatus;
}

function equipmentBase(clientId: string, branchId: string) {
  return `/clients/${clientId}/branches/${branchId}/equipment`;
}

export function useEquipment(clientId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: ['equipment', clientId, branchId],
    queryFn: () =>
      api.get<PaginatedResponse<Equipment>>(
        `${equipmentBase(clientId!, branchId!)}?limit=100`,
      ),
    enabled: !!clientId && !!branchId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      branchId,
      data,
    }: {
      clientId: string;
      branchId: string;
      data: EquipmentFormData;
    }) => api.post<Equipment>(equipmentBase(clientId, branchId), data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['equipment', vars.clientId, vars.branchId] });
    },
  });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      branchId,
      id,
      data,
    }: {
      clientId: string;
      branchId: string;
      id: string;
      data: Partial<EquipmentFormData>;
    }) =>
      api.patch<Equipment>(`${equipmentBase(clientId, branchId)}/${id}`, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['equipment', vars.clientId, vars.branchId] });
    },
  });
}

export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      branchId,
      id,
    }: {
      clientId: string;
      branchId: string;
      id: string;
    }) =>
      api.delete<{ id: string }>(`${equipmentBase(clientId, branchId)}/${id}`),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['equipment', vars.clientId, vars.branchId] });
    },
  });
}

export function useAssignQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      branchId,
      id,
    }: {
      clientId: string;
      branchId: string;
      id: string;
    }) =>
      api.post<Equipment>(`${equipmentBase(clientId, branchId)}/${id}/qr-code`, {}),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['equipment', vars.clientId, vars.branchId] });
    },
  });
}
