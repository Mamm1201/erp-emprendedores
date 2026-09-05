import { randomBytes } from 'crypto';

// Token opaco de alta entropía para identificadores públicos verificables por
// QR (Equipment.qrCode, Accreditation.qrCode). No correlativo, no derivado
// del id de la entidad. Formato: 12 caracteres base64url.
export function generateOpaqueToken(): string {
  return randomBytes(9).toString('base64url');
}
