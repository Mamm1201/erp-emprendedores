import { Prisma } from '../../generated/prisma/client';

export const CLIENT_SELECT = {
  id: true,
  type: true,
  legalName: true,
  tradeName: true,
  taxId: true,
  email: true,
  phone: true,
  notes: true,
  isIncomeTaxRetentionAgent: true,
  isIcaRetentionAgent: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;

export const CLIENT_DEFAULT_PAGE = 1;
export const CLIENT_DEFAULT_LIMIT = 20;
export const CLIENT_MAX_LIMIT = 100;
