export type EquipmentStatus = 'ACTIVE' | 'INACTIVE' | 'DECOMMISSIONED';

export interface BranchPublicDto {
  name: string;
  city: string | null;
}

export interface LastMaintenanceDto {
  date: string;
  type: 'PREVENTIVE' | 'CORRECTIVE';
}

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
  if (eq.warrantyExpiresAt) {
    const expiry = new Date(eq.warrantyExpiresAt);
    if (expiry < new Date()) return 'contract_expired';
  }
  return 'active';
}
