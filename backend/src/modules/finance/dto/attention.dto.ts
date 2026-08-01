// Listas de atención (T-10), snapshot as-of-now. Cuatro listas independientes;
// la priorización es responsabilidad del frontend. Campos mínimos para
// identificar el elemento y ejecutar la acción. Reutiliza criterios ya
// definidos: overdue = getSummary.overdue; completedNotInvoiced = etapa
// "Cerrada sin facturar" del embudo (T-09); completedNoCost = condición de T-05.

export interface OverdueInvoiceItem {
  invoiceId: string;
  number: string;
  clientName: string;
  total: string; // total bruto, igual que getSummary.overdue
  dueDate: Date;
}

export interface CompletedNotInvoicedItem {
  workOrderId: string;
  number: string;
  clientName: string;
  total: string; // wo.total (estimado), igual que el monto del embudo en esa etapa
  completedAt: Date | null;
}

export interface CompletedNoCostItem {
  workOrderId: string;
  number: string;
  clientName: string;
  completedAt: Date | null;
}

export interface NegativeMarginItem {
  workOrderId: string;
  number: string;
  clientName: string;
  revenue: string; // mejor ingreso disponible: invoice.total si firme, si no wo.total
  cost: string; // Σ gastos de la OT (deletedAt null)
  margin: string; // revenue − cost (< 0)
  firmness: 'real' | 'estimado'; // origen del ingreso: firme vs estimado
}

export interface AttentionDto {
  overdue: OverdueInvoiceItem[];
  completedNotInvoiced: CompletedNotInvoicedItem[];
  completedNoCost: CompletedNoCostItem[];
  negativeMargin: NegativeMarginItem[];
}
