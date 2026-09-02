import { Prisma } from '../../generated/prisma/client';

export const CONTACT_SELECT = {
  id: true,
  accountId: true,
  branchId: true,
  name: true,
  role: true,
  area: true,
  linkedinUrl: true,
  email: true,
  phone: true,
  influenceLevel: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ContactSelect;

export const CONTACT_DEFAULT_PAGE = 1;
export const CONTACT_DEFAULT_LIMIT = 20;
export const CONTACT_MAX_LIMIT = 100;
