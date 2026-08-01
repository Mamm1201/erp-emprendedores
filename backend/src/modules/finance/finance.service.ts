import { Injectable } from '@nestjs/common';

// Contexto Finanzas: capa de lectura derivada y de solo lectura. Compone sobre
// los repositorios existentes; NO es una segunda fuente de verdad. Las
// agregaciones analíticas (rollup por cliente, receivable, pulse, atención)
// llegan en T-07 en adelante. T-06 solo entrega la infraestructura.
@Injectable()
export class FinanceService {
  ping() {
    return { module: 'finance', status: 'ok' } as const;
  }
}
