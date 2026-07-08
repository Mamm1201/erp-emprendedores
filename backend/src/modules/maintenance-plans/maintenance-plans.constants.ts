import { Prisma } from '../../generated/prisma/client';

export const MAINTENANCE_PLAN_SELECT = {
  id: true,
  contractId: true,
  frequency: true,
  startDate: true,
  isActive: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  contract: {
    select: {
      id: true,
      number: true,
      status: true,
      client: { select: { id: true, legalName: true, tradeName: true } },
    },
  },
} satisfies Prisma.MaintenancePlanSelect;

export const MAINTENANCE_PLAN_DEFAULT_PAGE = 1;
export const MAINTENANCE_PLAN_DEFAULT_LIMIT = 20;
export const MAINTENANCE_PLAN_MAX_LIMIT = 100;
