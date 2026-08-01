import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, WorkOrderStatus } from '../../generated/prisma/client';
import { toMoney } from '../../common/utils/money.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ClientFinanceDto } from './dto/client-finance.dto';

// Contexto Finanzas: capa de lectura derivada y de solo lectura. Compone sobre
// los repositorios existentes; NO es una segunda fuente de verdad. Las facetas
// de salud de cobro / aging (T-08), recurrencia y filtros por período llegan
// más adelante; T-07 entrega el rollup económico base por cliente.
@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  ping() {
    return { module: 'finance', status: 'ok' } as const;
  }

  // Rollup económico único por cliente (T-07), all-time. Fuente única por
  // concepto: facturado = Invoice firme por clientId; costo = Expense de sus OT;
  // margen = facturado − costo; nº OT = OT no canceladas. Resuelto con
  // aggregate/count únicos (sin N+1).
  async getClientFinance(clientId: string): Promise<ClientFinanceDto> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException(`Client "${clientId}" not found`);
    }

    // ── Asimetría intencional (decisión de dominio · NO "corregir" en refactors) ──
    // El COSTO incluye los gastos de OT canceladas: representa el costo económico
    // real incurrido por el cliente (dinero efectivamente gastado = pérdida real),
    // por eso el filtro de gastos NO excluye CANCELLED.
    // El workOrderCount EXCLUYE las OT canceladas: mide actividad operativa
    // completada, no intención. Una OT cancelada no es actividad económica.
    // Los dos criterios son deliberadamente distintos y deben conservarse así.
    const [invoicedAgg, expenseAgg, workOrderCount] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: {
          clientId,
          status: {
            in: [
              InvoiceStatus.ISSUED,
              InvoiceStatus.PARTIALLY_PAID,
              InvoiceStatus.PAID,
            ],
          },
        },
        _sum: { total: true },
      }),
      this.prisma.expense.aggregate({
        where: { deletedAt: null, workOrder: { clientId } },
        _sum: { amount: true },
      }),
      this.prisma.workOrder.count({
        where: {
          clientId,
          deletedAt: null,
          status: { not: WorkOrderStatus.CANCELLED },
        },
      }),
    ]);

    const invoicedTotal = toMoney(invoicedAgg._sum.total ?? 0);
    const expenseTotal = toMoney(expenseAgg._sum.amount ?? 0);
    const grossMargin = invoicedTotal.sub(expenseTotal);

    return {
      clientId,
      invoicedTotal: invoicedTotal.toFixed(2),
      expenseTotal: expenseTotal.toFixed(2),
      grossMargin: grossMargin.toFixed(2),
      workOrderCount,
    };
  }
}
