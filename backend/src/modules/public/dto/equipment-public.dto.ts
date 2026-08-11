export class LastMaintenanceDto {
  date: string; // YYYY-MM-DD — WorkOrder.completedAt (D-4.1)
  type: 'PREVENTIVE' | 'CORRECTIVE';
}

export class BranchPublicDto {
  name: string;
  city: string | null;
}

/**
 * DTO de salida para el portal QR público.
 *
 * Contrato explícito: solo los campos definidos aquí llegan al cliente.
 * Excluidos: id, branchId, criticality, notes, deletedAt, createdAt,
 * updatedAt, clientId, número de OT, técnico, hallazgos/notas de la OT,
 * cualquier dato financiero o de usuario interno.
 *
 * lastMaintenance (D-4 + D-4.1): última OT COMPLETED de tipo PREVENTIVE o
 * CORRECTIVE vinculada al equipo. null si no existe ninguna.
 *
 * lastPreventiveMaintenance: solo se resuelve cuando lastMaintenance es
 * CORRECTIVE — último PREVENTIVE COMPLETED del mismo equipo, para no dar a
 * entender que un activo sin plan preventivo vigente. null en cualquier otro
 * caso (preventivo ya es el último, no hay preventivo previo, o no hay
 * ningún mantenimiento).
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
  lastMaintenance: LastMaintenanceDto | null;
  lastPreventiveMaintenance: LastMaintenanceDto | null;
}
