import { Prisma } from '../../generated/prisma/client';

export const ACTIVITY_SELECT = {
  id: true,
  accountId: true,
  opportunityId: true,
  contactId: true,
  type: true,
  status: true,
  occurredAt: true,
  summary: true,
  outcome: true,
  aiGenerated: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.ActivitySelect;

export const ACTIVITY_DEFAULT_PAGE = 1;
export const ACTIVITY_DEFAULT_LIMIT = 20;
export const ACTIVITY_MAX_LIMIT = 100;
