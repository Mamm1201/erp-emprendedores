export type EquipmentStatus = 'ACTIVE' | 'INACTIVE' | 'DECOMMISSIONED';

export interface BranchPublicDto {
  name: string;
  city: string | null;
}

export interface LastMaintenanceDto {
  date: string;
  type: 'PREVENTIVE' | 'CORRECTIVE';
}

// Relacion comercial del activo con STECH NODES. NO confundir con
// EquipmentStatus (estado operativo interno, mismos strings ACTIVE/
// INACTIVE pero significado distinto) — por eso el nombre y los valores
// del campo son deliberadamente distintos.
export type RelationshipStatus = 'CURRENT' | 'LAPSED';

export interface EquipmentPublicDto {
  qrCode: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  installDate: string | null;
  location: string | null;
  status: EquipmentStatus;
  warrantyExpiresAt: string | null;
  branch: BranchPublicDto;
  relationshipStatus: RelationshipStatus;
  lastMaintenance: LastMaintenanceDto | null;
  lastPreventiveMaintenance: LastMaintenanceDto | null;
}

export type PortalState =
  | 'active'
  | 'offline'
  | 'decommissioned'
  | 'contract_expired';

export function derivePortalState(eq: EquipmentPublicDto): PortalState {
  if (eq.status === 'DECOMMISSIONED') return 'decommissioned';
  if (eq.status === 'INACTIVE') return 'offline';
  if (eq.relationshipStatus === 'LAPSED') return 'contract_expired';
  return 'active';
}
