import { Prisma } from '../../generated/prisma/client';

export const MAINTENANCE_PLAN_SELECT = {
  id: true,
  contractId: true,
  branchId: true,
  frequency: true,
  firstPeriodStart: true,
  isActive: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  branch: { select: { id: true, name: true, city: true } },
  contract: {
    select: {
      id: true,
      number: true,
      status: true,
      startDate: true,
      endDate: true,
      client: { select: { id: true, legalName: true, tradeName: true } },
    },
  },
  _count: { select: { planEquipment: { where: { removedAt: null } } } },
} satisfies Prisma.MaintenancePlanSelect;

export const MAINTENANCE_PLAN_DEFAULT_PAGE = 1;
export const MAINTENANCE_PLAN_DEFAULT_LIMIT = 20;
export const MAINTENANCE_PLAN_MAX_LIMIT = 100;
