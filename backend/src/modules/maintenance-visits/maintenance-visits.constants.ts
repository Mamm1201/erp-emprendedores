import { Prisma } from '../../generated/prisma/client';

export const VISIT_EQUIPMENT_SELECT = {
  id: true,
  equipmentId: true,
  origin: true,
  status: true,
  notAttendedReason: true,
  notAttendedNote: true,
  earlyExecutionNote: true,
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
  intervention: {
    select: { id: true, occurredAt: true, status: true },
  },
} satisfies Prisma.MaintenanceVisitEquipmentSelect;

export const VISIT_SELECT = {
  id: true,
  planId: true,
  periodStart: true,
  periodEnd: true,
  scheduledDate: true,
  status: true,
  compliance: true,
  closedAt: true,
  cancelReason: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  workOrder: {
    select: { id: true, number: true, status: true },
  },
  equipment: {
    select: VISIT_EQUIPMENT_SELECT,
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.MaintenanceVisitSelect;
