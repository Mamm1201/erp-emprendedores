import { Prisma } from '../../generated/prisma/client';

export const VISIT_SELECT = {
  id: true,
  planId: true,
  scheduledDate: true,
  windowEnd: true,
  status: true,
  completedAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  workOrder: {
    select: { id: true, number: true, status: true },
  },
} satisfies Prisma.MaintenanceVisitSelect;
