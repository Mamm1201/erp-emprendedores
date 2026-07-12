export type UserRole = 'ADMIN' | 'COMMERCIAL' | 'TECHNICIAN' | 'BILLING';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Technician {
  id: string;
  name: string;
}

export type ClientType = 'COMPANY' | 'PERSON';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'VOID';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CHECK' | 'CARD' | 'OTHER';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  lineOrder: number;
  description: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxRate: string;
  lineSubtotal: string;
  lineTotal: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  paidAt: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWithInvoice extends Payment {
  invoice: {
    id: string;
    number: string;
    client: { id: string; legalName: string; tradeName: string | null };
  };
}

export interface DashboardData {
  quotations: {
    draft: number;
    sent: number;
    approved: number;
    total: number;
  };
  workOrders: {
    draft: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    completedWithoutInvoice: number;
    total: number;
  };
  invoices: {
    draft: number;
    issued: number;
    partiallyPaid: number;
    paid: number;
    totalReceivable: string;
    paidThisMonth: string;
    overdue: { count: number; total: string };
  };
  recentPayments: Array<{
    id: string;
    amount: string;
    paidAt: string;
    method: PaymentMethod;
    reference: string | null;
    invoice: {
      id: string;
      number: string;
      client: { legalName: string; tradeName: string | null };
    };
  }>;
  upcomingVisits: UpcomingVisit[];
  maintenance: {
    activeContracts: number;
    activePlans: number;
    overdueVisits: number;
  };
}

export interface FinancialStatusGroup {
  count: number;
  total: string;
}

export interface FinancialSummary {
  byStatus: Partial<Record<InvoiceStatus, FinancialStatusGroup>>;
  overdue: { count: number; total: string };
  totalReceivable: string;
  partiallyPaidAmount: string;
  paidThisMonth: string;
  paidLastMonth: string;
  revenueByMonth: Array<{ yearMonth: string; amount: string }>;
}

export interface Invoice {
  id: string;
  number: string;
  workOrderId: string | null;
  contractId: string | null;
  clientId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; legalName: string; tradeName: string | null };
  workOrder: { id: string; number: string; status: string } | null;
  contract: { id: string; number: string } | null;
  items?: InvoiceItem[];
  payments?: Payment[];
}

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
  sentAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  rejectionNotes: string | null;
  cancellationNotes: string | null;
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

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
export type BillingCycle = 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'EVERY_4_MONTHS' | 'BIANNUAL' | 'ANNUAL';
export type ServiceHoursLevel = 'BUSINESS_HOURS' | 'EXTENDED' | 'FULL_24_7';

export interface MaintenanceContract {
  id: string;
  number: string;
  status: ContractStatus;
  billingCycle: BillingCycle;
  value: string;
  startDate: string;
  endDate: string;
  signedAt: string | null;
  correctiveIncluded: boolean;
  partsIncluded: boolean;
  transportIncluded: boolean;
  serviceHours: ServiceHoursLevel;
  slaHoursCritical: number | null;
  slaHoursHigh: number | null;
  slaHoursMedium: number | null;
  slaHoursLow: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; legalName: string; tradeName: string | null };
  signedBy: { id: string; name: string } | null;
  quotation: { id: string; number: string } | null;
  invoices: Array<{
    id: string;
    number: string;
    status: InvoiceStatus;
    total: string;
    dueDate: string;
  }>;
}

export interface MaintenancePlan {
  id: string;
  contractId: string;
  frequency: MaintenanceFrequency;
  startDate: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contract: {
    id: string;
    number: string;
    status: ContractStatus;
    client: { id: string; legalName: string; tradeName: string | null };
  };
}

export type MaintenanceVisitStatus = 'PENDING' | 'GENERATED' | 'COMPLETED' | 'CANCELLED';

export interface MaintenanceVisit {
  id: string;
  planId: string;
  scheduledDate: string;
  windowEnd: string | null;
  status: MaintenanceVisitStatus;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  workOrder: { id: string; number: string; status: string } | null;
}

export interface UpcomingVisit {
  id: string;
  scheduledDate: string;
  status: string;
  plan: {
    frequency: MaintenanceFrequency;
    contract: {
      client: { legalName: string; tradeName: string | null };
    };
  };
}

export interface UpcomingVisitsResponse {
  data: UpcomingVisit[];
  meta: { days: number; from: string; until: string };
}

export type ExpenseCategory =
  | 'MATERIALS'
  | 'LABOR'
  | 'TRANSPORT'
  | 'TOOLS'
  | 'SUBCONTRACT'
  | 'OFFICE'
  | 'OTHER';

export interface Expense {
  id: string;
  workOrderId: string;
  category: ExpenseCategory;
  description: string;
  amount: string;
  expenseDate: string;
  vendorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderItem {
  id: string;
  workOrderId: string;
  lineOrder: number;
  description: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxRate: string;
  lineSubtotal: string;
  lineTotal: string;
  createdAt: string;
  updatedAt: string;
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
  equipmentId: string | null;
  equipment: { id: string; type: EquipmentType; brand: string | null; model: string | null; serialNumber: string | null } | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; legalName: string; tradeName: string | null };
  branch: { id: string; name: string; city: string | null } | null;
  serviceRecord: { id: string } | null;
  invoice: { id: string; number: string; status: string } | null;
  quotation: { id: string; number: string } | null;
  items?: WorkOrderItem[];
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
  qrCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssociatedEquipment {
  equipmentId: string;
  addedAt: string;
  equipment: {
    id: string;
    type: EquipmentType;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    location: string | null;
    status: EquipmentStatus;
    branchId: string;
    branch: { id: string; name: string };
  };
}

export type FileEntityType =
  | 'EQUIPMENT'
  | 'WORK_ORDER'
  | 'SERVICE_RECORD'
  | 'CLIENT'
  | 'QUOTATION'
  | 'INVOICE';

export type FileCategory = 'PHOTO' | 'DOCUMENT' | 'CERTIFICATE' | 'MANUAL';

export interface FileAttachment {
  id: string;
  entityType: FileEntityType;
  entityId: string;
  category: FileCategory;
  originalName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  description: string | null;
  takenAt: string | null;
  uploadedById: string;
  uploadedBy: { id: string; name: string };
  createdAt: string;
  url: string;
}
