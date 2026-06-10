import { Prisma } from '../../generated/prisma/client';

export const MAINTENANCE_PLAN_SELECT = {
  id: true,
  clientId: true,
  branchId: true,
  frequency: true,
  contractStartDate: true,
  contractEndDate: true,
  nextVisitDate: true,
  isActive: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MaintenancePlanSelect;

export const MAINTENANCE_PLAN_DEFAULT_PAGE = 1;
export const MAINTENANCE_PLAN_DEFAULT_LIMIT = 20;
export const MAINTENANCE_PLAN_MAX_LIMIT = 100;
