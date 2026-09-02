import { Prisma } from '../../generated/prisma/client';

export const ACCOUNT_SELECT = {
  id: true,
  legalName: true,
  nit: true,
  city: true,
  institutionType: true,
  sizePotential: true,
  website: true,
  status: true,
  source: true,
  notes: true,
  ownerId: true,
  promotedClientId: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true } },
} satisfies Prisma.AccountSelect;

export const ACCOUNT_DEFAULT_PAGE = 1;
export const ACCOUNT_DEFAULT_LIMIT = 20;
export const ACCOUNT_MAX_LIMIT = 100;
