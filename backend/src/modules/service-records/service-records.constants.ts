import { EquipmentType, Prisma } from '../../generated/prisma/client';

export const SERVICE_RECORD_SELECT = {
  id: true,
  workOrderId: true,
  findings: true,
  activitiesPerformed: true,
  recommendations: true,
  clientSignedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceRecordSelect;

export const CHECKLIST_ITEM_SELECT = {
  id: true,
  serviceRecordId: true,
  description: true,
  result: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ChecklistItemSelect;

export const INTERVENTION_SELECT = {
  id: true,
  workOrderId: true,
  equipmentId: true,
  type: true,
  status: true,
  findings: true,
  activitiesPerformed: true,
  recommendations: true,
  occurredAt: true,
  createdAt: true,
  updatedAt: true,
  primaryTechnicianId: true,
  primaryTechnician: {
    select: { id: true, name: true },
  },
  equipment: {
    select: {
      id: true,
      type: true,
      brand: true,
      model: true,
      serialNumber: true,
      location: true,
    },
  },
  checklistItems: {
    select: CHECKLIST_ITEM_SELECT,
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.InterventionSelect;

export const INTERVENTION_WITH_WORK_ORDER_SELECT = {
  ...INTERVENTION_SELECT,
  workOrder: {
    select: {
      id: true,
      number: true,
      title: true,
      type: true,
      scheduledAt: true,
      completedAt: true,
    },
  },
} satisfies Prisma.InterventionSelect;

export const DEFAULT_CHECKLIST: Record<EquipmentType, string[]> = {
  [EquipmentType.NURSE_CALL]: [
    'Verificar alimentación central',
    'Probar cada pulsador',
    'Verificar indicadores luminosos',
    'Probar audio bidireccional',
    'Revisar cableado visible',
    'Limpiar unidades',
  ],
  [EquipmentType.MEDICAL_ALERT]: [
    'Verificar alimentación central',
    'Probar señales de alerta por código',
    'Verificar indicadores y paneles',
    'Revisar cableado visible',
    'Limpiar unidades',
  ],
  [EquipmentType.GENERATOR]: [
    'Nivel de aceite',
    'Nivel de refrigerante',
    'Batería de arranque',
    'Prueba de carga',
    'Filtro de aire',
    'Revisar fugas',
  ],
  [EquipmentType.UPS]: [
    'Prueba de batería',
    'Tiempo de respaldo medido',
    'Temperatura interna',
    'Alarmas activas',
    'Conexiones',
  ],
  [EquipmentType.ELECTRICAL]: [
    'Verificar tablero principal',
    'Revisar breakers y protecciones',
    'Medición de tensión en circuitos críticos',
    'Revisar conexiones a tierra',
    'Verificar estado de cableado visible',
  ],
  [EquipmentType.OTHER]: [],
};
