// Contrato de respuesta del rollup económico por cliente (T-07). Montos como
// string (Decimal serializado, 2 decimales), igual que el resto de la API.
// Alcance T-07: facturado, costo, margen y nº de OT. La salud de cobro (por
// cobrar / aging) es responsabilidad de T-08; recurrencia y filtros por período
// se añadirán cuando la vista los requiera.
export interface ClientFinanceDto {
  clientId: string;

  // Σ total de las facturas firmes del cliente (ISSUED / PARTIALLY_PAID / PAID),
  // por Invoice.clientId, incluidas las provenientes de contrato. Excluye DRAFT
  // y anuladas (VOID). Caveat: la rentabilidad de las facturas de contrato es
  // parcial mientras no exista imputación de costos del contrato.
  invoicedTotal: string;

  // Σ gastos (deletedAt null) de las OT del cliente. Los gastos sin OT no son
  // imputables a un cliente y quedan fuera.
  expenseTotal: string;

  // invoicedTotal − expenseTotal.
  grossMargin: string;

  // Nº de OT del cliente que no están canceladas (deletedAt null).
  workOrderCount: number;
}
