import { Prisma } from '../../generated/prisma/client';

export const EQUIPMENT_SELECT = {
  id: true,
  branchId: true,
  type: true,
  brand: true,
  model: true,
  serialNumber: true,
  installDate: true,
  location: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EquipmentSelect;

export const EQUIPMENT_DEFAULT_PAGE = 1;
export const EQUIPMENT_DEFAULT_LIMIT = 50;
export const EQUIPMENT_MAX_LIMIT = 200;
