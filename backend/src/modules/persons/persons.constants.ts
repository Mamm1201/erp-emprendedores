import { Prisma } from '../../generated/prisma/client';

export const PERSON_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  profile: true,
  relationshipType: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true, name: true, role: true } },
} satisfies Prisma.PersonSelect;

export const PERSON_DEFAULT_PAGE = 1;
export const PERSON_DEFAULT_LIMIT = 20;
export const PERSON_MAX_LIMIT = 100;
