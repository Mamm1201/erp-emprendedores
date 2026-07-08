import { DocumentType, Prisma } from '../../generated/prisma/client';

export const CONTRACT_NUMBER_PREFIX = 'CMTO';
export const CONTRACT_DOCUMENT_TYPE = DocumentType.MAINTENANCE_CONTRACT;
export const CONTRACT_DEFAULT_PAGE = 1;
export const CONTRACT_DEFAULT_LIMIT = 20;

export const CONTRACT_SELECT = {
  id: true,
  number: true,
  status: true,
  billingCycle: true,
  value: true,
  startDate: true,
  endDate: true,
  signedAt: true,
  correctiveIncluded: true,
  partsIncluded: true,
  transportIncluded: true,
  serviceHours: true,
  slaHoursCritical: true,
  slaHoursHigh: true,
  slaHoursMedium: true,
  slaHoursLow: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: { id: true, legalName: true, tradeName: true },
  },
  signedBy: {
    select: { id: true, name: true },
  },
  quotation: {
    select: { id: true, number: true },
  },
} satisfies Prisma.MaintenanceContractSelect;
