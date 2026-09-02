import { Prisma } from '../../generated/prisma/client';

export const SERVICE_SELECT = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceSelect;
