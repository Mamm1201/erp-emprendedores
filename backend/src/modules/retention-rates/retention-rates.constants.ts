import { Prisma } from '../../generated/prisma/client';

export const RETENTION_RATE_SELECT = {
  id: true,
  concept: true,
  municipalityCode: true,
  taxpayerConditionNote: true,
  rate: true,
  rateMin: true,
  rateMax: true,
  minimumBaseUvt: true,
  uvtValueSnapshot: true,
  legalSource: true,
  effectiveFrom: true,
  effectiveTo: true,
} satisfies Prisma.RetentionRateSelect;
