import { DocumentType, Prisma } from '../../generated/prisma/client';

export const QUOTATION_SELECT = {
  id: true,
  number: true,
  clientId: true,
  branchId: true,
  status: true,
  issueDate: true,
  validUntil: true,
  notes: true,
  terms: true,
  subtotal: true,
  discountTotal: true,
  taxTotal: true,
  total: true,
  retentionsApplied: true,
  clientLegalName: true,
  clientTaxId: true,
  branchName: true,
  branchAddress: true,
  branchCity: true,
  branchDepartment: true,
  branchContactName: true,
  branchContactPhone: true,
  snapshotAt: true,
  sentAt: true,
  approvedAt: true,
  rejectedAt: true,
  cancelledAt: true,
  rejectionNotes: true,
  cancellationNotes: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, legalName: true, tradeName: true } },
  branch: { select: { id: true, name: true, city: true } },
} satisfies Prisma.QuotationSelect;

export const QUOTATION_RETENTION_LINE_SELECT = {
  id: true,
  quotationId: true,
  concept: true,
  jurisdictionSnapshot: true,
  taxpayerConditionSnapshot: true,
  rateSnapshot: true,
  legalSourceSnapshot: true,
  estimatedAmount: true,
  createdAt: true,
} satisfies Prisma.QuotationRetentionLineSelect;

export const QUOTATION_ITEM_SELECT = {
  id: true,
  quotationId: true,
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
} satisfies Prisma.QuotationItemSelect;

export const QUOTATION_DOCUMENT_TYPE = DocumentType.QUOTATION;
export const QUOTATION_NUMBER_PREFIX = 'COT';

export const QUOTATION_DEFAULT_PAGE = 1;
export const QUOTATION_DEFAULT_LIMIT = 20;
export const QUOTATION_MAX_LIMIT = 100;
