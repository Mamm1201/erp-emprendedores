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
