import { Injectable } from '@nestjs/common';
import {
  ContractStatus,
  InvoiceStatus,
  QuotationStatus,
  WorkOrderStatus,
} from '../../generated/prisma/client';
import { toMoney, sumMoney } from '../../common/utils/money.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      quotationGroups,
      workOrderGroups,
      invoiceGroups,
      paidThisMonthAgg,
      partialPaidAgg,
      overdueAgg,
      recentPayments,
      upcomingVisits,
      completedWithoutInvoice,
      approvedQuotations,
      activeContracts,
      activePlans,
      overdueVisits,
    ] = await Promise.all([
      this.prisma.quotation.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.workOrder.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { total: true },
      }),
      this.prisma.payment.aggregate({
        where: { voidedAt: null, paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          voidedAt: null,
          invoice: { status: InvoiceStatus.PARTIALLY_PAID },
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] },
          dueDate: { lt: now },
        },
        _count: { id: true },
        _sum: { total: true },
      }),
      this.prisma.payment.findMany({
        where: { voidedAt: null },
        orderBy: { paidAt: 'desc' },
        take: 6,
        select: {
          id: true,
          amount: true,
          paidAt: true,
          method: true,
          reference: true,
          invoice: {
            select: {
              id: true,
              number: true,
              client: { select: { legalName: true, tradeName: true } },
            },
          },
        },
      }),
      this.prisma.maintenanceVisit.findMany({
        where: {
          status: 'PENDING',
          scheduledDate: { gte: now, lte: next30Days },
          plan: { isActive: true },
        },
        orderBy: { scheduledDate: 'asc' },
        take: 8,
        select: {
          id: true,
          scheduledDate: true,
          status: true,
          plan: {
            select: {
              frequency: true,
              contract: {
                select: {
                  client: { select: { legalName: true, tradeName: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.workOrder.count({
        where: {
          deletedAt: null,
          status: WorkOrderStatus.COMPLETED,
          invoice: null,
        },
      }),
      this.prisma.quotation.count({
        where: {
          deletedAt: null,
          status: QuotationStatus.APPROVED,
        },
      }),
      this.prisma.maintenanceContract.count({
        where: { deletedAt: null, status: ContractStatus.ACTIVE },
      }),
      this.prisma.maintenancePlan.count({
        where: { isActive: true },
      }),
      this.prisma.maintenanceVisit.count({
        where: { status: 'PENDING', scheduledDate: { lt: now }, plan: { isActive: true } },
      }),
    ]);

    // Build lookup maps
    const qMap = Object.fromEntries(
      quotationGroups.map((g) => [g.status, g._count.id]),
    );
    const woMap = Object.fromEntries(
      workOrderGroups.map((g) => [g.status, g._count.id]),
    );
    const invMap = Object.fromEntries(
      invoiceGroups.map((g) => [
        g.status,
        { count: g._count.id, total: g._sum.total ?? toMoney(0) },
      ]),
    );

    // Net receivable
    const issuedTotal = toMoney(invMap[InvoiceStatus.ISSUED]?.total ?? 0);
    const partialTotal = toMoney(
      invMap[InvoiceStatus.PARTIALLY_PAID]?.total ?? 0,
    );
    const partialPaid = toMoney(partialPaidAgg._sum.amount ?? 0);
    const totalReceivable = issuedTotal.add(partialTotal).sub(partialPaid);

    return {
      quotations: {
        draft: qMap[QuotationStatus.DRAFT] ?? 0,
        sent: qMap[QuotationStatus.SENT] ?? 0,
        approved: approvedQuotations,
        total: Object.values(qMap).reduce((a, b) => a + b, 0),
      },
      workOrders: {
        draft: woMap[WorkOrderStatus.DRAFT] ?? 0,
        scheduled: woMap[WorkOrderStatus.SCHEDULED] ?? 0,
        inProgress: woMap[WorkOrderStatus.IN_PROGRESS] ?? 0,
        completed: woMap[WorkOrderStatus.COMPLETED] ?? 0,
        completedWithoutInvoice,
        total: Object.values(woMap).reduce((a, b) => a + b, 0),
      },
      invoices: {
        draft: invMap[InvoiceStatus.DRAFT]?.count ?? 0,
        issued: invMap[InvoiceStatus.ISSUED]?.count ?? 0,
        partiallyPaid: invMap[InvoiceStatus.PARTIALLY_PAID]?.count ?? 0,
        paid: invMap[InvoiceStatus.PAID]?.count ?? 0,
        totalReceivable: totalReceivable.toFixed(2),
        paidThisMonth: (paidThisMonthAgg._sum.amount ?? toMoney(0)).toFixed(2),
        overdue: {
          count: overdueAgg._count.id,
          total: (overdueAgg._sum.total ?? toMoney(0)).toFixed(2),
        },
      },
      recentPayments,
      upcomingVisits,
      maintenance: {
        activeContracts,
        activePlans,
        overdueVisits,
      },
    };
  }
}
