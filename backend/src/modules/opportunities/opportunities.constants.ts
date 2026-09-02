import { Prisma } from '../../generated/prisma/client';

export const OPPORTUNITY_SELECT = {
  id: true,
  accountId: true,
  primaryContactId: true,
  title: true,
  detectedNeed: true,
  score: true,
  priority: true,
  stage: true,
  source: true,
  probability: true,
  potentialValue: true,
  notes: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true } },
  primaryContact: { select: { id: true, name: true } },
  services: { select: { id: true, name: true } },
} satisfies Prisma.OpportunitySelect;

export const OPPORTUNITY_DEFAULT_PAGE = 1;
export const OPPORTUNITY_DEFAULT_LIMIT = 20;
export const OPPORTUNITY_MAX_LIMIT = 100;
