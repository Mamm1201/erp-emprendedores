import type { EquipmentType, WorkOrderType } from '@/lib/types';

// Naturaleza de la OT (docs/domain/supply-line-contract-v1.0.md).

export const WORK_ORDER_TYPE_LABELS: Record<WorkOrderType, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  INSPECTION: 'Inspección',
  SUPPLY: 'Suministro',
};

// Naturalezas elegibles al crear o convertir una OT. PREVENTIVE queda
// reservado a las OTs generadas por visitas de mantenimiento.
export const SELECTABLE_WORK_ORDER_TYPES: WorkOrderType[] = ['CORRECTIVE', 'INSPECTION', 'SUPPLY'];

export const WORK_ORDER_TYPE_HELP: Record<WorkOrderType, string> = {
  PREVENTIVE: 'Generada desde una visita de mantenimiento.',
  CORRECTIVE: 'Intervención técnica sobre un equipo existente.',
  INSPECTION: 'Revisión o diagnóstico sin corrección.',
  SUPPLY:
    'Entrega de un equipo, módulo o periférico, con o sin instalación. Registra qué se suministró y sobre qué equipo aplica.',
};

export const EQUIPMENT_TYPE_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: 'NURSE_CALL', label: 'Llamado de enfermería' },
  { value: 'MEDICAL_ALERT', label: 'Alerta médica' },
  { value: 'GENERATOR', label: 'Generador' },
  { value: 'UPS', label: 'UPS' },
  { value: 'ELECTRICAL', label: 'Eléctrico' },
  { value: 'OTHER', label: 'Otro' },
];
