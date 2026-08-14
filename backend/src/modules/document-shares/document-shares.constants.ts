import { DocumentShareType } from '../../generated/prisma/client';

// Política de expiración centralizada — nunca hardcodear días sueltos en el
// servicio. Derivada del ciclo de vida real de cada documento (ver diseño):
// Cotización usa además quotation.validUntil como tope adicional si es menor.
export const DOCUMENT_SHARE_EXPIRATION_DAYS: Record<DocumentShareType, number> = {
  [DocumentShareType.QUOTATION]: 30,
  [DocumentShareType.INVOICE]: 90,
  [DocumentShareType.SERVICE_RECORD]: 60,
};

export const DOCUMENT_SHARE_TOKEN_BYTES = 24; // 192 bits

export const DOCUMENT_SHARE_LABEL: Record<DocumentShareType, string> = {
  [DocumentShareType.QUOTATION]: 'cotizacion',
  [DocumentShareType.INVOICE]: 'cuenta-cobro',
  [DocumentShareType.SERVICE_RECORD]: 'acta-tecnica',
};
