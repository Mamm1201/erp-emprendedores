import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ServiceRecord, Intervention, ChecklistResult } from '@/lib/types';

// Un equipo realmente intervenido durante la visita — solo estos deben
// enviarse aqui. Equipos programados/asociados que no se intervinieron no
// van en esta lista.
export interface InterventionInputData {
  equipmentId: string;
  findings?: string;
  activitiesPerformed?: string;
  recommendations?: string;
  primaryTechnicianId?: string;
}

export interface CreateServiceRecordData {
  interventions?: InterventionInputData[];
  clientSignedAt?: string;
}

export interface UpdateServiceRecordData {
  findings?: string;
  activitiesPerformed?: string;
  recommendations?: string;
  clientSignedAt?: string;
}

export interface UpdateInterventionData {
  findings?: string;
  activitiesPerformed?: string;
  recommendations?: string;
  primaryTechnicianId?: string;
}

export function useServiceRecord(workOrderId: string | null) {
  return useQuery({
    queryKey: ['service-record', workOrderId],
    queryFn: () =>
      api.get<ServiceRecord>(`/work-orders/${workOrderId}/service-record`),
    enabled: !!workOrderId,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useCreateServiceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workOrderId,
      data,
    }: {
      workOrderId: string;
      data: CreateServiceRecordData;
    }) =>
      api.post<ServiceRecord>(`/work-orders/${workOrderId}/service-record`, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['service-record', vars.workOrderId] });
      qc.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

export function useUpdateServiceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workOrderId,
      data,
    }: {
      workOrderId: string;
      data: UpdateServiceRecordData;
    }) =>
      api.patch<ServiceRecord>(`/work-orders/${workOrderId}/service-record`, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['service-record', vars.workOrderId] });
    },
  });
}

export function useUpdateIntervention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workOrderId,
      interventionId,
      data,
    }: {
      workOrderId: string;
      interventionId: string;
      data: UpdateInterventionData;
    }) =>
      api.patch<Intervention>(
        `/work-orders/${workOrderId}/interventions/${interventionId}`,
        data,
      ),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['service-record', vars.workOrderId] });
    },
  });
}

export function useUpdateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      workOrderId,
      itemId,
      result,
      notes,
    }: {
      workOrderId: string;
      itemId: string;
      result?: ChecklistResult;
      notes?: string;
    }) =>
      api.patch(`/work-orders/${workOrderId}/service-record/checklist/${itemId}`, {
        result,
        notes,
      }),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['service-record', vars.workOrderId] });
    },
  });
}
