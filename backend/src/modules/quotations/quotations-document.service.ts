import { DocumentType, Prisma } from '../../generated/prisma/client';
import {
  QUOTATION_DOCUMENT_TYPE,
  QUOTATION_NUMBER_PREFIX,
} from './quotations.constants';

export async function nextDocumentNumber(
  tx: Prisma.TransactionClient,
  docType: DocumentType,
  prefix: string,
): Promise<string> {
  const year = new Date().getFullYear();

  const sequence = await tx.documentSequence.upsert({
    where: {
      docType_year: { docType, year },
    },
    create: {
      docType,
      year,
      lastValue: 1,
    },
    update: {
      lastValue: { increment: 1 },
    },
  });

  const padded = String(sequence.lastValue).padStart(5, '0');
  return `${prefix}-${year}-${padded}`;
}

export function nextQuotationNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  return nextDocumentNumber(
    tx,
    QUOTATION_DOCUMENT_TYPE,
    QUOTATION_NUMBER_PREFIX,
  );
}
