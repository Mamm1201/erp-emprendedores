import { DocumentType, Prisma } from '../../generated/prisma/client';

export const INVOICE_SELECT = {
  id: true,
  number: true,
  workOrderId: true,
  clientId: true,
  status: true,
  issueDate: true,
  dueDate: true,
  notes: true,
  subtotal: true,
  discountTotal: true,
  taxTotal: true,
  total: true,
  voidedAt: true,
  voidReason: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, legalName: true, tradeName: true } },
  workOrder: { select: { id: true, number: true, status: true } },
  contractId: true,
  contract: { select: { id: true, number: true } },
} satisfies Prisma.InvoiceSelect;

export const INVOICE_ITEM_SELECT = {
  id: true,
  invoiceId: true,
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
} satisfies Prisma.InvoiceItemSelect;

export const PAYMENT_SELECT = {
  id: true,
  invoiceId: true,
  amount: true,
  paidAt: true,
  method: true,
  reference: true,
  notes: true,
  voidedAt: true,
  voidReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PaymentSelect;

export const INVOICE_DOCUMENT_TYPE = DocumentType.INVOICE;
export const INVOICE_NUMBER_PREFIX = 'CC';

export const INVOICE_DEFAULT_PAGE = 1;
export const INVOICE_DEFAULT_LIMIT = 20;
export const INVOICE_MAX_LIMIT = 100;
