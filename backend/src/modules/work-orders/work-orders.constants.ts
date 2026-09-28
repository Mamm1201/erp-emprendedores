import { DocumentType, Prisma } from '../../generated/prisma/client';
import { VISIT_EQUIPMENT_SELECT } from '../maintenance-visits/maintenance-visits.constants';

export const WORK_ORDER_SELECT = {
  id: true,
  number: true,
  clientId: true,
  branchId: true,
  quotationId: true,
  status: true,
  title: true,
  description: true,
  scheduledAt: true,
  startedAt: true,
  completedAt: true,
  subtotal: true,
  discountTotal: true,
  taxTotal: true,
  total: true,
  equipmentId: true,
  equipment: {
    select: {
      id: true,
      type: true,
      brand: true,
      model: true,
      serialNumber: true,
    },
  },
  assignedToId: true,
  assignedTo: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, legalName: true, tradeName: true } },
  branch: { select: { id: true, name: true, city: true } },
  serviceRecord: { select: { id: true } },
  invoice: { select: { id: true, number: true, status: true } },
  quotation: { select: { id: true, number: true } },
  // Visita de mantenimiento que origino la OT (equipos programados y su
  // conciliacion) — null en OTs que no vienen de un plan.
  maintenanceVisit: {
    select: {
      id: true,
      planId: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      equipment: {
        select: VISIT_EQUIPMENT_SELECT,
        orderBy: { createdAt: 'asc' },
      },
    },
  },
} satisfies Prisma.WorkOrderSelect;

export const WORK_ORDER_ITEM_SELECT = {
  id: true,
  workOrderId: true,
  lineOrder: true,
  description: true,
  quantity: true,
  unitPrice: true,
  discountAmount: true,
  taxRate: true,
  lineSubtotal: true,
  lineTotal: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WorkOrderItemSelect;

export const WORK_ORDER_DOCUMENT_TYPE = DocumentType.WORK_ORDER;
export const WORK_ORDER_NUMBER_PREFIX = 'OT';

export const WORK_ORDER_DEFAULT_PAGE = 1;
export const WORK_ORDER_DEFAULT_LIMIT = 20;
export const WORK_ORDER_MAX_LIMIT = 100;
