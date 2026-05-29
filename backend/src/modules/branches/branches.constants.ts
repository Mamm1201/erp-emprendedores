import { Prisma } from '../../generated/prisma/client';

export const BRANCH_SELECT = {
  id: true,
  clientId: true,
  name: true,
  contactName: true,
  contactPhone: true,
  email: true,
  address: true,
  city: true,
  department: true,
  notes: true,
  isPrimary: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BranchSelect;

export const BRANCH_DEFAULT_PAGE = 1;
export const BRANCH_DEFAULT_LIMIT = 20;
export const BRANCH_MAX_LIMIT = 100;
