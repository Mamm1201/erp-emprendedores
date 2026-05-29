import { BadRequestException } from '@nestjs/common';
import { QuotationStatus } from '../../generated/prisma/client';

const TERMINAL_STATUSES: QuotationStatus[] = [
  QuotationStatus.REJECTED,
  QuotationStatus.EXPIRED,
  QuotationStatus.CANCELLED,
  QuotationStatus.CONVERTED,
];

const ALLOWED_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  [QuotationStatus.DRAFT]: [
    QuotationStatus.SENT,
    QuotationStatus.CANCELLED,
  ],
  [QuotationStatus.SENT]: [
    QuotationStatus.APPROVED,
    QuotationStatus.REJECTED,
    QuotationStatus.EXPIRED,
    QuotationStatus.CANCELLED,
  ],
  [QuotationStatus.APPROVED]: [
    QuotationStatus.CANCELLED,
    QuotationStatus.CONVERTED,
  ],
  [QuotationStatus.REJECTED]: [],
  [QuotationStatus.EXPIRED]: [],
  [QuotationStatus.CANCELLED]: [],
  [QuotationStatus.CONVERTED]: [],
};

export function assertStatusTransition(
  current: QuotationStatus,
  next: QuotationStatus,
): void {
  if (current === next) {
    return;
  }

  const allowed = ALLOWED_TRANSITIONS[current];

  if (!allowed.includes(next)) {
    throw new BadRequestException(
      `Cannot transition quotation from ${current} to ${next}`,
    );
  }
}

export function isEditableStatus(status: QuotationStatus): boolean {
  return status === QuotationStatus.DRAFT;
}

export function isTerminalStatus(status: QuotationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function requiresCommercialSnapshot(status: QuotationStatus): boolean {
  return (
    status === QuotationStatus.SENT ||
    status === QuotationStatus.APPROVED ||
    status === QuotationStatus.CONVERTED
  );
}
