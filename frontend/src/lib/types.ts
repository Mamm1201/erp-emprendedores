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

// ─── Receivable (módulo Finance · GET /finance/receivable) ────────────────────

export interface ReceivableAgingBucket {
  bucket: string; // 'No vencido' | '1-30' | '31-60' | '61-90' | '90+'
  amount: string;
  count: number;
}

export interface ReceivableByClient {
  clientId: string;
  clientName: string;
  amount: string;
  count: number;
}

export interface ReceivableConcentration {
  topN: number;
  amount: string;
  pct: number;
}

export interface Receivable {
  totalReceivable: string;
  aging: ReceivableAgingBucket[];
  byClient: ReceivableByClient[];
  concentration: ReceivableConcentration;
}

// Rollup económico por cliente (módulo Finance · GET /finance/clients/:clientId)
export interface ClientFinance {
  clientId: string;
  invoicedTotal: string;
  expenseTotal: string;
  grossMargin: string;
  workOrderCount: number;
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
  paidTotal?: string; // Σ pagos no anulados (expuesto por el listado y el detalle)
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

// ─── Retenciones (RETE FUENTE / RETE ICA) ──────────────────────────────────────

export type RetentionConcept = 'RETE_FUENTE' | 'RETE_ICA';

// Espejo de RETENTION_RATE_SELECT (backend) — configuración, GET /retention-rates.
// cityLabel es el texto de Branch.city ya resuelto por el backend (null para
// RETE_FUENTE, nacional); el DIVIPOLA nunca se serializa hacia el frontend.
export interface RetentionRate {
  id: string;
  concept: RetentionConcept;
  cityLabel: string | null;
  taxpayerConditionNote: string | null;
  rate: string | null;
  rateMin: string | null;
  rateMax: string | null;
  minimumBaseUvt: string | null;
  uvtValueSnapshot: string | null;
  legalSource: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

// Espejo de QUOTATION_RETENTION_LINE_SELECT (backend) — snapshot persistido
export interface QuotationRetentionLine {
  id: string;
  quotationId: string;
  concept: RetentionConcept;
  taxpayerConditionSnapshot: string | null;
  rateSnapshot: string | null;
  rateMinSnapshot: string | null;
  rateMaxSnapshot: string | null;
  legalSourceSnapshot: string;
  estimatedAmount: string | null;
  estimatedAmountMin: string | null;
  estimatedAmountMax: string | null;
  createdAt: string;
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
  retentionsApplied: boolean;
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
  retentionLines?: QuotationRetentionLine[];
  workOrder?: { id: string; number: string; status: string } | null;
  // CRM de Prospección — vínculo con la Opportunity que la originó (F1.1 /
  // trazabilidad Opportunity↔Quotation). null para toda cotización tradicional.
  opportunityId: string | null;
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
export type EquipmentCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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
  isIncomeTaxRetentionAgent: boolean;
  isIcaRetentionAgent: boolean;
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

// ── Utilización de recurso (OT-8 · contexto Operaciones · sin economía) ──
export type ResourceCategory = 'MATERIAL' | 'LABOR' | 'EXPENSE';
export type ResourceOrigin = 'PLANNED' | 'ADDITIONAL';

export interface ResourceUtilization {
  id: string;
  resourceName: string;
  category: ResourceCategory;
  quantity: string;
  unit: string;
  origin: ResourceOrigin;
  observation: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
}

// ── Preparación de Facturación (RFC-06 · contexto Facturación) ──
export type BillingPreparationStatus = 'DRAFT' | 'CONFIRMED';
export type BillingResolution = 'CHARGE' | 'ABSORB';

export interface BillingLineResolutionView {
  id: string;
  resolution: BillingResolution;
  source: string;
  billableQuantity: string | null;
  unitPrice: string | null;
  discountAmount: string;
  taxRate: string;
  lineTotal: string;
}

export interface BillingPreparationElement {
  utilization: {
    id: string;
    resourceName: string;
    category: ResourceCategory;
    quantity: string;
    unit: string;
    origin: ResourceOrigin;
    observation: string | null;
  };
  resolution: BillingLineResolutionView | null;
}

export interface BillingPreparation {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  status: BillingPreparationStatus;
  notes: string | null;
  createdAt: string;
  confirmedAt: string | null;
  createdBy: { id: string; name: string };
  confirmedBy: { id: string; name: string } | null;
  elements: BillingPreparationElement[];
  result: {
    chargedCount: number;
    absorbedCount: number;
    pendingCount: number;
    total: string;
  };
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
  invoice: { id: string; number: string; status: string; total?: string; paidTotal?: string } | null;
  quotation: { id: string; number: string } | null;
  items?: WorkOrderItem[];
  technicians?: { id: string; name: string }[];
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

export type InterventionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Un equipo realmente intervenido durante la visita — fuente de verdad de
// trazabilidad por activo. Ver ServiceRecord.interventions.
export interface Intervention {
  id: string;
  workOrderId: string;
  equipmentId: string;
  type: string;
  status: InterventionStatus;
  findings: string | null;
  activitiesPerformed: string | null;
  recommendations: string | null;
  occurredAt: string | null;
  createdAt: string;
  updatedAt: string;
  primaryTechnicianId: string | null;
  primaryTechnician: { id: string; name: string } | null;
  equipment: {
    id: string;
    type: EquipmentType;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    location: string | null;
  };
  checklistItems: ChecklistItem[];
}

export interface ServiceRecord {
  id: string;
  workOrderId: string;
  findings: string | null;
  activitiesPerformed: string | null;
  recommendations: string | null;
  clientSignedAt: string | null;
  createdAt: string;
  updatedAt: string;
  checklistItems: ChecklistItem[];
  interventions: Intervention[];
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
  criticality: EquipmentCriticality;
  warrantyExpiresAt: string | null;
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
  | 'INVOICE'
  | 'INTERVENTION';

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

export type DocumentShareType = 'QUOTATION' | 'INVOICE' | 'SERVICE_RECORD';

export interface DocumentShareResult {
  url: string;
  expiresAt: string;
  contact: {
    email: string | null;
    phone: string | null;
  };
}

// ─── CRM de Prospección Comercial (F1.1-F1.8) ──────────────────────────────────
// Espejo exacto del schema/contratos de backend — sin propiedades hipotéticas.

export type InstitutionType = 'IPS' | 'CLINIC' | 'HOSPITAL' | 'OTHER';
export type SizePotential = 'SMALL' | 'MEDIUM' | 'LARGE';
export type AccountStatus = 'ACTIVE_PROSPECT' | 'CUSTOMER' | 'DORMANT' | 'DISQUALIFIED';
export type LeadSource = 'LINKEDIN' | 'REFERRAL' | 'INBOUND' | 'EVENT' | 'OTHER';

export interface Account {
  id: string;
  legalName: string;
  nit: string | null;
  city: string;
  institutionType: InstitutionType;
  sizePotential: SizePotential | null;
  website: string | null;
  status: AccountStatus;
  source: LeadSource;
  notes: string | null;
  ownerId: string;
  promotedClientId: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string };
}

export type ContactRole =
  | 'IPS_MANAGER'
  | 'ADMIN_DIRECTOR'
  | 'INFRASTRUCTURE_DIRECTOR'
  | 'MAINTENANCE_COORDINATOR'
  | 'HOSPITAL_ENGINEERING'
  | 'BIOMEDICAL_MANAGER'
  | 'PROCUREMENT'
  | 'QUALITY_COMPLIANCE'
  | 'OTHER';

export type InfluenceLevel = 'DECISION_MAKER' | 'INFLUENCER' | 'GATEKEEPER' | 'UNKNOWN';

export interface Contact {
  id: string;
  accountId: string;
  branchId: string | null;
  name: string;
  role: ContactRole;
  area: string | null;
  linkedinUrl: string | null;
  email: string | null;
  phone: string | null;
  influenceLevel: InfluenceLevel;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OpportunityStage =
  | 'IDENTIFIED'
  | 'RESEARCHING'
  | 'CONTACTED'
  | 'CONVERSING'
  | 'MEETING_DIAGNOSIS'
  | 'QUOTED'
  | 'NEGOTIATING'
  | 'WON'
  | 'LOST';

export type OpportunityPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  accountId: string;
  primaryContactId: string | null;
  title: string;
  detectedNeed: string | null;
  score: number;
  priority: OpportunityPriority;
  stage: OpportunityStage;
  source: LeadSource;
  probability: number | null;
  potentialValue: string | null;
  notes: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string };
  primaryContact: { id: string; name: string } | null;
  services: { id: string; name: string }[];
}

export type ActivityType =
  | 'LINKEDIN'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'CALL'
  | 'MEETING'
  | 'NOTE'
  | 'PROPOSAL'
  | 'FOLLOW_UP';

export type ActivityStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED';

export interface Activity {
  id: string;
  accountId: string;
  opportunityId: string | null;
  contactId: string | null;
  type: ActivityType;
  status: ActivityStatus;
  occurredAt: string;
  summary: string;
  outcome: string | null;
  // Preparación del modelo para la futura integración de IA (F1.1) — no se
  // expone en ningún formulario de F1.9, conserva su comportamiento actual.
  aiGenerated: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
}

// ─── Personal / Acreditación (Fase 4) ──────────────────────────────────────────
// Person = identidad de una persona que participa en la operación de STECH
// NODES. User = cuenta opcional de acceso al ERP asociada a una Person.
// Person.profile es una clasificación operacional interna, independiente de
// UserRole (permisos del ERP) y de Accreditation.displayRole (etiqueta
// pública) — no se sincronizan entre sí.

export type PersonProfile =
  | 'TECHNICIAN_INTERNAL'
  | 'TECHNICIAN_EXTERNAL'
  | 'BIOMEDICAL_ENGINEER'
  | 'INDEPENDENT_PROFESSIONAL'
  | 'CONTRACTOR'
  | 'ADMIN_STAFF'
  | 'OTHER';

export type RelationshipType = 'EMPLOYEE' | 'CONTRACTOR' | 'INDEPENDENT' | 'EXTERNAL_OTHER';

export interface Person {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  profile: PersonProfile;
  relationshipType: RelationshipType;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; name: string; role: UserRole } | null;
}

export type AccreditationStatus = 'ACTIVE' | 'REVOKED';

export interface Accreditation {
  id: string;
  personId: string;
  qrCode: string;
  displayRole: string;
  status: AccreditationStatus;
  validFrom: string | null;
  validUntil: string | null;
  issuedById: string;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
  issuedBy: { id: string; name: string };
}
