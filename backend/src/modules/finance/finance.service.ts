import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceStatus,
  Prisma,
  WorkOrderStatus,
} from '../../generated/prisma/client';
import { sumMoney, toMoney } from '../../common/utils/money.util';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { ClientFinanceDto } from './dto/client-finance.dto';
import { ReceivableDto } from './dto/receivable.dto';

// Tramos de aging por antigüedad (días de vencimiento sobre dueDate).
const AGING_BUCKETS = ['No vencido', '1-30', '31-60', '61-90', '90+'] as const;
type AgingBucketLabel = (typeof AGING_BUCKETS)[number];

function agingBucketFor(dueDate: Date, now: Date): AgingBucketLabel {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / DAY_MS);
  if (daysPastDue <= 0) return 'No vencido';
  if (daysPastDue <= 30) return '1-30';
  if (daysPastDue <= 60) return '31-60';
  if (daysPastDue <= 90) return '61-90';
  return '90+';
}

// Contexto Finanzas: capa de lectura derivada y de solo lectura. Compone sobre
// los repositorios existentes; NO es una segunda fuente de verdad. La
// recurrencia y los filtros por período llegan cuando la vista los requiera.
@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
  ) {}

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

  // Receivable con aging y cartera por cliente (T-08), snapshot as-of-now.
  // Opción C: el titular global lo aporta InvoicesService.getSummary (fuente
  // única); FinanceService deriva el detalle (saldo por factura = total − pagos
  // vigentes, sobre ISSUED/PARTIALLY_PAID) y lo protege con invariantes de suma.
  async getReceivable(): Promise<ReceivableDto> {
    const now = new Date();

    const [invoices, summary] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          status: {
            in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID],
          },
        },
        select: {
          total: true,
          dueDate: true,
          clientId: true,
          client: { select: { tradeName: true, legalName: true } },
          payments: { where: { voidedAt: null }, select: { amount: true } },
        },
      }),
      this.invoicesService.getSummary(),
    ]);

    const agingAmount = new Map<AgingBucketLabel, Prisma.Decimal>();
    const agingCount = new Map<AgingBucketLabel, number>();
    for (const b of AGING_BUCKETS) {
      agingAmount.set(b, toMoney(0));
      agingCount.set(b, 0);
    }
    const byClientMap = new Map<
      string,
      { clientName: string; amount: Prisma.Decimal; count: number }
    >();

    for (const inv of invoices) {
      // Saldo neto por factura (sin clamp: los sobrepagos quedan visibles).
      const outstanding = toMoney(inv.total).sub(
        sumMoney(inv.payments.map((p) => toMoney(p.amount))),
      );

      const bucket = agingBucketFor(new Date(inv.dueDate), now);
      agingAmount.set(bucket, agingAmount.get(bucket)!.add(outstanding));
      agingCount.set(bucket, agingCount.get(bucket)! + 1);

      const clientName = inv.client.tradeName ?? inv.client.legalName;
      const entry = byClientMap.get(inv.clientId) ?? {
        clientName,
        amount: toMoney(0),
        count: 0,
      };
      entry.amount = entry.amount.add(outstanding);
      entry.count += 1;
      byClientMap.set(inv.clientId, entry);
    }

    const aging = AGING_BUCKETS.map((bucket) => ({
      bucket,
      amount: agingAmount.get(bucket)!.toFixed(2),
      count: agingCount.get(bucket)!,
    }));

    const byClientSorted = Array.from(byClientMap.entries())
      .map(([clientId, v]) => ({
        clientId,
        clientName: v.clientName,
        amount: v.amount,
        count: v.count,
      }))
      .sort((a, b) => b.amount.cmp(a.amount));

    // ── Invariantes (Opción C): el detalle debe cuadrar con la fuente global ──
    // La duplicación de la fórmula de saldo queda protegida por esta verificación
    // hasta que exista evidencia suficiente para extraer una abstracción común.
    const sumAging = sumMoney(AGING_BUCKETS.map((b) => agingAmount.get(b)!));
    const sumByClient = sumMoney(byClientSorted.map((c) => c.amount));
    const totalReceivable = toMoney(summary.totalReceivable);

    if (
      !sumAging.equals(sumByClient) ||
      !sumByClient.equals(totalReceivable)
    ) {
      this.logger.error(
        `Invariante de receivable violado: Σaging=${sumAging.toFixed(2)} ` +
          `Σcliente=${sumByClient.toFixed(2)} ` +
          `getSummary.totalReceivable=${totalReceivable.toFixed(2)}`,
      );
      throw new InternalServerErrorException(
        'Inconsistencia en el cálculo del receivable (invariante de suma).',
      );
    }

    // Concentración Top 5 (presentación del mismo rollup por cliente).
    const topN = 5;
    const top = byClientSorted.slice(0, topN);
    const topAmount = sumMoney(top.map((c) => c.amount));
    const pct = totalReceivable.isZero()
      ? 0
      : topAmount.div(totalReceivable).mul(100).toDecimalPlaces(1).toNumber();

    return {
      totalReceivable: totalReceivable.toFixed(2),
      aging,
      byClient: byClientSorted.map((c) => ({
        clientId: c.clientId,
        clientName: c.clientName,
        amount: c.amount.toFixed(2),
        count: c.count,
      })),
      concentration: { topN, amount: topAmount.toFixed(2), pct },
    };
  }
}
