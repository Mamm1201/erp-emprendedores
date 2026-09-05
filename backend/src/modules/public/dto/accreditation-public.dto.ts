// Estado de verificación pública de una Accreditation — no confundir con
// Accreditation.status (administrativo, ACTIVE/REVOKED). VALID combina el
// status administrativo, la ventana de vigencia (validFrom/validUntil) y que
// la Person asociada no esté eliminada (soft-delete). Ver Fase 3.1/Fase 4.
export type AccreditationVerificationStatus = 'VALID' | 'NOT_VALID';

/**
 * DTO de salida para el portal QR público de acreditaciones.
 *
 * Contrato explícito: solo los campos definidos aquí llegan al cliente.
 * Excluidos siempre: id, personId, relationshipType, profile, email,
 * teléfono, notas, revokedReason, issuedById, cualquier fecha interna
 * (validFrom/validUntil no se exponen como fechas, solo como el resultado
 * booleano de la vigencia), documentos, cliente, OT. Ver Fase 4, Contrato de
 * Implementación — Decisión 3 de Fase 3.1 (definición pública de
 * Accreditation).
 */
export class AccreditationPublicDto {
  personName: string;
  displayRole: string;
  status: AccreditationVerificationStatus;
}
