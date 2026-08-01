// Contrato de respuesta del receivable (T-08). Snapshot a la fecha actual
// (as-of-now); montos como string (Decimal serializado, 2 decimales).
//
// Fuente única del titular: `totalReceivable` proviene de
// InvoicesService.getSummary (InvoicesService sigue siendo el dueño del
// receivable global). `aging` y `byClient` son el detalle derivado por
// FinanceService, protegido por invariantes de suma (Opción C). No se aplica
// clamp: los sobrepagos (saldos netos negativos) permanecen visibles.

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
  topN: number; // 5
  amount: string; // Σ saldo de los top N clientes
  pct: number; // % sobre totalReceivable (0 si no hay cartera)
}

export interface ReceivableDto {
  totalReceivable: string;
  aging: ReceivableAgingBucket[];
  byClient: ReceivableByClient[];
  concentration: ReceivableConcentration;
}
