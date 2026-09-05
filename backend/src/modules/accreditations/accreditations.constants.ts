import { Prisma } from '../../generated/prisma/client';

export const ACCREDITATION_SELECT = {
  id: true,
  personId: true,
  qrCode: true,
  displayRole: true,
  status: true,
  validFrom: true,
  validUntil: true,
  issuedById: true,
  revokedAt: true,
  revokedReason: true,
  createdAt: true,
  updatedAt: true,
  issuedBy: { select: { id: true, name: true } },
} satisfies Prisma.AccreditationSelect;
