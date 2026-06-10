import { DocumentType, Prisma } from '../../generated/prisma/client';

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
  assignedToId: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, legalName: true, tradeName: true } },
  branch: { select: { id: true, name: true, city: true } },
  serviceRecord: { select: { id: true } },
  invoice: { select: { id: true, number: true, status: true } },
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
