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
  upcomingVisits: Array<{
    id: string;
    nextVisitDate: string;
    frequency: MaintenanceFrequency;
    client: { legalName: string; tradeName: string | null };
    branch: { name: string; city: string | null } | null;
  }>;
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
  workOrderId: string;
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
  workOrder: { id: string; number: string; status: string };
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
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; legalName: string; tradeName: string | null };
  branch: { id: string; name: string; city: string | null } | null;
  serviceRecord: { id: string } | null;
  invoice: { id: string; number: string; status: string } | null;
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
  createdAt: string;
  updatedAt: string;
}
