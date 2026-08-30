export class LastMaintenanceDto {
  date: string; // YYYY-MM-DD — Intervention.occurredAt
  type: 'PREVENTIVE' | 'CORRECTIVE';
}

// Relación comercial del activo con STECH NODES — NO confundir con
// Equipment.status (estado operativo interno, mismos strings ACTIVE/
// INACTIVE pero significado distinto). CURRENT: contrato de mantenimiento
// vigente para el equipo, o al menos una Intervention completada en los
// ultimos 12 meses. LAPSED: ninguna de las dos condiciones.
export type RelationshipStatus = 'CURRENT' | 'LAPSED';

export class BranchPublicDto {
  name: string;
  city: string | null;
}

/**
 * DTO de salida para el portal QR público.
 *
 * Contrato explícito: solo los campos definidos aquí llegan al cliente.
 * Excluidos siempre: id, branchId, criticality, notes, deletedAt,
 * createdAt, updatedAt, clientId, número de OT, técnico, checklist,
 * hallazgos, actividades realizadas, recomendaciones, evidencia
 * fotográfica/documentos, cualquier dato financiero o de usuario interno.
 * Ver [[project_qr_closure_and_production_readiness]] — especificación
 * cerrada 2026-08-29.
 *
 * lastMaintenance / lastPreventiveMaintenance: última Intervention COMPLETED
 * del equipo (y, si esa fue CORRECTIVE, la última PREVENTIVE previa). Solo
 * se poblan cuando relationshipStatus es CURRENT — si es LAPSED, ambos
 * llegan en null aunque exista historial real (el historial nunca se borra
 * del ERP, solo deja de exponerse públicamente).
 */
export class EquipmentPublicDto {
  qrCode: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  installDate: string | null;
  location: string | null;
  status: string;
  warrantyExpiresAt: string | null;
  branch: BranchPublicDto;
  relationshipStatus: RelationshipStatus;
  lastMaintenance: LastMaintenanceDto | null;
  lastPreventiveMaintenance: LastMaintenanceDto | null;
}
