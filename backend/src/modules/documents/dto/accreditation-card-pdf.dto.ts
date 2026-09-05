// DTO del carnet PDF de una Accreditation. Representa el estado ACTUAL de la
// acreditación en el momento de generación — nunca información personal más
// allá de lo que ya es público en /public/accreditation/:qrCode. Ver
// Fase 3.1 / Fase 4, Contrato de Implementación (definición pública de
// Accreditation): no incluye relationshipType, Person.profile, documento de
// identidad, correo, teléfono, ni ninguna referencia a cliente/OT.
export interface AccreditationCardPdfDto {
  personName: string;
  displayRole: string;
  vigente: boolean;
  validFrom: string | null;
  validUntil: string | null;
  qrDataUrl: string;
  generatedAt: string;
}
