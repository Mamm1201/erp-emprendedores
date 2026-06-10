export type ClientType = 'COMPANY' | 'PERSON';

export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED'
  | 'CANCELLED';

export interface QuotationItem {
  id: string;
  quotationId: string;
  lineOrder: number;
  description: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxRate: string;
  lineSubtotal: string;
  lineTotal: string;
}

export interface Quotation {
  id: string;
  number: string;
  clientId: string;
  branchId: string | null;
  status: QuotationStatus;
  issueDate: string;
  validUntil: string | null;
  notes: string | null;
  terms: string | null;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  clientLegalName: string | null;
  clientTaxId: string | null;
  branchName: string | null;
  branchCity: string | null;
  snapshotAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; legalName: string; tradeName: string | null };
  branch: { id: string; name: string; city: string | null } | null;
  items?: QuotationItem[];
  workOrder?: { id: string; number: string; status: string } | null;
}

export type MaintenanceFrequency =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'EVERY_4_MONTHS'
  | 'BIANNUAL'
  | 'ANNUAL';

export type WorkOrderStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type EquipmentType =
  | 'NURSE_CALL'
  | 'MEDICAL_ALERT'
  | 'GENERATOR'
  | 'UPS'
  | 'ELECTRICAL'
  | 'OTHER';

export type EquipmentStatus = 'ACTIVE' | 'INACTIVE' | 'DECOMMISSIONED';

// ─── API response shapes ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Client {
  id: string;
  type: ClientType;
  legalName: string;
  tradeName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  clientId: string;
  name: string;
  contactName: string | null;
  contactPhone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  department: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenancePlan {
  id: string;
  clientId: string;
  branchId: string | null;
  frequency: MaintenanceFrequency;
  contractStartDate: string;
  contractEndDate: string | null;
  nextVisitDate: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; legalName: string; tradeName: string | null };
  branch: { id: string; name: string; city: string | null } | null;
}

export type UpcomingVisit = MaintenancePlan;

export interface UpcomingVisitsResponse {
  data: UpcomingVisit[];
  meta: { days: number; from: string; until: string };
}

export interface WorkOrder {
  id: string;
  number: string;
  clientId: string;
  branchId: string | null;
  quotationId: string | null;
  status: WorkOrderStatus;
  title: string;
  description: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; legalName: string; tradeName: string | null };
  branch: { id: string; name: string; city: string | null } | null;
  serviceRecord: { id: string } | null;
}

export type ChecklistResult = 'OK' | 'WARNING' | 'FAIL' | 'NA';

export interface ChecklistItem {
  id: string;
  serviceRecordId: string;
  description: string;
  result: ChecklistResult;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRecord {
  id: string;
  workOrderId: string;
  equipmentId: string | null;
  findings: string | null;
  activitiesPerformed: string | null;
  recommendations: string | null;
  clientSignedAt: string | null;
  createdAt: string;
  updatedAt: string;
  checklistItems: ChecklistItem[];
}

export interface Equipment {
  id: string;
  branchId: string;
  type: EquipmentType;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  installDate: string | null;
  location: string | null;
  notes: string | null;
  status: EquipmentStatus;
  createdAt: string;
  updatedAt: string;
}
