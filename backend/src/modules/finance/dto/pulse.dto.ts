import { InvoicesService } from '../../invoices/invoices.service';

// Signos vitales reutilizados tal cual de InvoicesService.getSummary (fuente
// única; no se recalculan). El tipo se deriva del método para no duplicar la
// forma.
export type InvoiceSummary = Awaited<ReturnType<InvoicesService['getSummary']>>;

export interface PulseFunnelStage {
  // 'En ejecución' | 'Cerrada sin facturar' | 'Facturada sin cobrar' | 'Cobrada'
  stage: string;
  count: number;
  amount: string;
}

export interface PulseMargin {
  invoiced: string; // facturado firme (all-time), derivado de getSummary.byStatus
  cost: string; // costo directo = Σ gastos de OT (deletedAt null)
  gross: string; // invoiced − cost
  pct: number; // gross / invoiced * 100 (0 si invoiced es 0)
}

// Pulso (T-09), all-time. `funnel` = lente OT (embudo del ciclo económico);
// `margin` = margen bruto global; `summary` = signos vitales de getSummary.
export interface PulseDto {
  funnel: PulseFunnelStage[];
  margin: PulseMargin;
  summary: InvoiceSummary;
}
