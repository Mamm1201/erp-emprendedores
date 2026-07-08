import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceStatus,
  PaymentMethod,
  Prisma,
  WorkOrderStatus,
} from '../../generated/prisma/client';
import {
  calculateLineTotals,
  sumMoney,
  toMoney,
} from '../../common/utils/money.util';
import { PrismaService } from '../../prisma/prisma.service';
import { nextDocumentNumber } from '../quotations/quotations-document.service';
import {
  INVOICE_DEFAULT_LIMIT,
  INVOICE_DEFAULT_PAGE,
  INVOICE_DOCUMENT_TYPE,
  INVOICE_ITEM_SELECT,
  INVOICE_NUMBER_PREFIX,
  INVOICE_SELECT,
  PAYMENT_SELECT,
} from './invoices.constants';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VoidPaymentDto } from './dto/void-payment.dto';
import { InvoiceItemDto } from './dto/invoice-item.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';

const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.ISSUED, InvoiceStatus.VOID],
  [InvoiceStatus.ISSUED]: [InvoiceStatus.VOID],
  [InvoiceStatus.PARTIALLY_PAID]: [InvoiceStatus.VOID],
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.VOID]: [],
};

const WO_ITEMS_SELECT = {
  lineOrder: true,
  description: true,
  quantity: true,
  unitPrice: true,
  discountAmount: true,
  taxRate: true,
  lineSubtotal: true,
  lineTotal: true,
} satisfies Prisma.WorkOrderItemSelect;

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryInvoicesDto) {
    const page = query.page ?? INVOICE_DEFAULT_PAGE;
    const limit = query.limit ?? INVOICE_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        select: INVOICE_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      select: {
        ...INVOICE_SELECT,
        items: { select: INVOICE_ITEM_SELECT, orderBy: { lineOrder: 'asc' } },
        payments: { select: PAYMENT_SELECT, orderBy: { paidAt: 'asc' } },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice "${id}" not found`);
    }

    return invoice;
  }

  async create(dto: CreateInvoiceDto, userId: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: dto.workOrderId, deletedAt: null },
      select: {
        id: true,
        status: true,
        clientId: true,
        items: { select: WO_ITEMS_SELECT, orderBy: { lineOrder: 'asc' } },
        invoice: { select: { id: true } },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`WorkOrder "${dto.workOrderId}" not found`);
    }

    if (workOrder.status !== WorkOrderStatus.COMPLETED) {
      throw new BadRequestException(
        'Invoice can only be created for COMPLETED work orders',
      );
    }

    if (workOrder.invoice) {
      throw new BadRequestException(
        'This work order already has an invoice',
      );
    }

    const itemsPayload =
      dto.items && dto.items.length > 0
        ? this.buildItemsPayload(dto.items)
        : this.copyItemsFromWorkOrder(workOrder.items);

    return this.prisma.$transaction(async (tx) => {
      const number = await nextDocumentNumber(
        tx,
        INVOICE_DOCUMENT_TYPE,
        INVOICE_NUMBER_PREFIX,
      );

      return tx.invoice.create({
        data: {
          number,
          workOrderId: dto.workOrderId,
          clientId: workOrder.clientId,
          status: InvoiceStatus.DRAFT,
          dueDate: new Date(dto.dueDate),
          notes: dto.notes ?? null,
          createdById: userId,
          subtotal: itemsPayload.totals.subtotal,
          discountTotal: itemsPayload.totals.discountTotal,
          taxTotal: itemsPayload.totals.taxTotal,
          total: itemsPayload.totals.total,
          items: itemsPayload.items.length > 0
            ? { create: itemsPayload.items }
            : undefined,
        },
        select: {
          ...INVOICE_SELECT,
          items: { select: INVOICE_ITEM_SELECT, orderBy: { lineOrder: 'asc' } },
          payments: { select: PAYMENT_SELECT },
        },
      });
    });
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    await this.findEditableInvoice(id);

    const itemsPayload = dto.items ? this.buildItemsPayload(dto.items) : null;

    return this.prisma.$transaction(async (tx) => {
      if (itemsPayload) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      }

      return tx.invoice.update({
        where: { id },
        data: {
          ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(itemsPayload && {
            subtotal: itemsPayload.totals.subtotal,
            discountTotal: itemsPayload.totals.discountTotal,
            taxTotal: itemsPayload.totals.taxTotal,
            total: itemsPayload.totals.total,
            items: { create: itemsPayload.items },
          }),
        },
        select: {
          ...INVOICE_SELECT,
          items: { select: INVOICE_ITEM_SELECT, orderBy: { lineOrder: 'asc' } },
          payments: { select: PAYMENT_SELECT },
        },
      });
    });
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice "${id}" not found`);
    }

    const allowed = ALLOWED_TRANSITIONS[invoice.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition invoice from ${invoice.status} to ${dto.status}`,
      );
    }

    const data: Prisma.InvoiceUpdateInput = { status: dto.status };
    if (dto.status === InvoiceStatus.VOID) {
      data.voidedAt = new Date();
      data.voidReason = dto.voidReason ?? null;
    }

    return this.prisma.invoice.update({
      where: { id },
      data,
      select: {
        ...INVOICE_SELECT,
        items: { select: INVOICE_ITEM_SELECT, orderBy: { lineOrder: 'asc' } },
        payments: { select: PAYMENT_SELECT, orderBy: { paidAt: 'asc' } },
      },
    });
  }

  async createPayment(invoiceId: string, dto: CreatePaymentDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, status: true, total: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice "${invoiceId}" not found`);
    }

    if (
      invoice.status !== InvoiceStatus.ISSUED &&
      invoice.status !== InvoiceStatus.PARTIALLY_PAID
    ) {
      throw new BadRequestException(
        'Payments can only be added to ISSUED or PARTIALLY_PAID invoices',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: toMoney(dto.amount),
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          method: dto.method ?? PaymentMethod.TRANSFER,
          reference: dto.reference ?? null,
          notes: dto.notes ?? null,
          createdById: userId,
        },
        select: PAYMENT_SELECT,
      });

      await this.recalculateInvoiceStatus(tx, invoiceId, invoice.total);

      return payment;
    });
  }

  async voidPayment(
    invoiceId: string,
    paymentId: string,
    dto: VoidPaymentDto,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, invoiceId },
      select: { id: true, voidedAt: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment "${paymentId}" not found`);
    }

    if (payment.voidedAt) {
      throw new BadRequestException('Payment already voided');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, total: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice "${invoiceId}" not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const voided = await tx.payment.update({
        where: { id: paymentId },
        data: {
          voidedAt: new Date(),
          voidReason: dto.voidReason ?? null,
        },
        select: PAYMENT_SELECT,
      });

      await this.recalculateInvoiceStatus(tx, invoiceId, invoice.total);

      return voided;
    });
  }

  private async recalculateInvoiceStatus(
    tx: Prisma.TransactionClient,
    invoiceId: string,
    invoiceTotal: Prisma.Decimal,
  ) {
    const payments = await tx.payment.findMany({
      where: { invoiceId, voidedAt: null },
      select: { amount: true },
    });

    const paidTotal = sumMoney(payments.map((p) => toMoney(p.amount)));

    let status: InvoiceStatus;
    if (paidTotal.gte(invoiceTotal)) {
      status = InvoiceStatus.PAID;
    } else if (paidTotal.gt(toMoney(0))) {
      status = InvoiceStatus.PARTIALLY_PAID;
    } else {
      status = InvoiceStatus.ISSUED;
    }

    await tx.invoice.update({ where: { id: invoiceId }, data: { status } });
  }

  private buildListWhere(query: QueryInvoicesDto): Prisma.InvoiceWhereInput {
    const where: Prisma.InvoiceWhereInput = {};

    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;

    if (query.fromDate || query.toDate) {
      where.issueDate = {
        ...(query.fromDate && { gte: new Date(query.fromDate) }),
        ...(query.toDate && { lte: new Date(query.toDate) }),
      };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { number: { contains: term, mode: 'insensitive' } },
        { client: { legalName: { contains: term, mode: 'insensitive' } } },
        { client: { tradeName: { contains: term, mode: 'insensitive' } } },
        { workOrder: { number: { contains: term, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  private buildItemsPayload(items: InvoiceItemDto[]) {
    const lineResults = items.map((item, index) => {
      const quantity = toMoney(item.quantity);
      const unitPrice = toMoney(item.unitPrice);
      const discountAmount = toMoney(item.discountAmount ?? 0);
      const taxRate = toMoney(item.taxRate ?? 0);
      const totals = calculateLineTotals({ quantity, unitPrice, discountAmount, taxRate });

      return {
        create: {
          lineOrder: item.lineOrder ?? index,
          description: item.description,
          quantity,
          unitPrice,
          discountAmount,
          taxRate,
          lineSubtotal: totals.lineSubtotal,
          lineTotal: totals.lineTotal,
        },
        discountAmount,
        lineSubtotal: totals.lineSubtotal,
        lineTax: totals.lineTax,
      };
    });

    const subtotal = sumMoney(lineResults.map((l) => l.lineSubtotal));
    const discountTotal = sumMoney(lineResults.map((l) => l.discountAmount));
    const taxTotal = sumMoney(lineResults.map((l) => l.lineTax));
    const total = sumMoney(lineResults.map((l) => l.create.lineTotal));

    return {
      items: lineResults.map((l) => l.create),
      totals: { subtotal, discountTotal, taxTotal, total },
    };
  }

  private copyItemsFromWorkOrder(
    woItems: Array<{
      lineOrder: number;
      description: string;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      taxRate: Prisma.Decimal;
      lineSubtotal: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
    }>,
  ) {
    if (woItems.length === 0) {
      return {
        items: [],
        totals: {
          subtotal: toMoney(0),
          discountTotal: toMoney(0),
          taxTotal: toMoney(0),
          total: toMoney(0),
        },
      };
    }

    const lineResults = woItems.map((item) => {
      const totals = calculateLineTotals({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxRate: item.taxRate,
      });

      return {
        create: {
          lineOrder: item.lineOrder,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxRate: item.taxRate,
          lineSubtotal: totals.lineSubtotal,
          lineTotal: totals.lineTotal,
        },
        discountAmount: item.discountAmount,
        lineSubtotal: totals.lineSubtotal,
        lineTax: totals.lineTax,
      };
    });

    const subtotal = sumMoney(lineResults.map((l) => l.lineSubtotal));
    const discountTotal = sumMoney(lineResults.map((l) => l.discountAmount));
    const taxTotal = sumMoney(lineResults.map((l) => l.lineTax));
    const total = sumMoney(lineResults.map((l) => l.create.lineTotal));

    return {
      items: lineResults.map((l) => l.create),
      totals: { subtotal, discountTotal, taxTotal, total },
    };
  }

  async findPayments(query: QueryPaymentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};
    if (!query.includeVoided) where.voidedAt = null;
    if (query.method) where.method = query.method;
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.clientId) where.invoice = { clientId: query.clientId };
    if (query.fromDate || query.toDate) {
      where.paidAt = {
        ...(query.fromDate && { gte: new Date(query.fromDate) }),
        ...(query.toDate && { lte: new Date(query.toDate) }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        select: {
          ...PAYMENT_SELECT,
          invoice: {
            select: {
              id: true,
              number: true,
              client: { select: { id: true, legalName: true, tradeName: true } },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getSummary() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const start12MonthsAgo = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      1,
    );

    const [
      statusGroups,
      overdueAgg,
      thisMonthAgg,
      lastMonthAgg,
      recentPayments,
      partialPaidAgg,
    ] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { total: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] },
          dueDate: { lt: now },
        },
        _count: { id: true },
        _sum: { total: true },
      }),
      this.prisma.payment.aggregate({
        where: { voidedAt: null, paidAt: { gte: startOfThisMonth } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          voidedAt: null,
          paidAt: { gte: startOfLastMonth, lt: startOfThisMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.findMany({
        where: { voidedAt: null, paidAt: { gte: start12MonthsAgo } },
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: 'asc' },
      }),
      this.prisma.payment.aggregate({
        where: {
          voidedAt: null,
          invoice: { status: InvoiceStatus.PARTIALLY_PAID },
        },
        _sum: { amount: true },
      }),
    ]);

    // Group payments by YYYY-MM in JavaScript
    const monthMap = new Map<string, Prisma.Decimal>();
    for (const p of recentPayments) {
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) ?? toMoney(0)).add(toMoney(p.amount)));
    }
    const revenueByMonth = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([yearMonth, amount]) => ({ yearMonth, amount: amount.toFixed(2) }));

    // byStatus map
    const byStatus: Record<string, { count: number; total: string }> = {};
    for (const g of statusGroups) {
      byStatus[g.status] = {
        count: g._count.id,
        total: (g._sum.total ?? toMoney(0)).toFixed(2),
      };
    }

    // Net receivable = issued total + partiallyPaid total - amounts already collected on partial
    const issuedTotal = toMoney(byStatus[InvoiceStatus.ISSUED]?.total ?? 0);
    const partialTotal = toMoney(
      byStatus[InvoiceStatus.PARTIALLY_PAID]?.total ?? 0,
    );
    const partialPaid = toMoney(partialPaidAgg._sum.amount ?? 0);
    const totalReceivable = issuedTotal.add(partialTotal).sub(partialPaid);

    return {
      byStatus,
      overdue: {
        count: overdueAgg._count.id,
        total: (overdueAgg._sum.total ?? toMoney(0)).toFixed(2),
      },
      totalReceivable: totalReceivable.toFixed(2),
      partiallyPaidAmount: partialPaid.toFixed(2),
      paidThisMonth: (thisMonthAgg._sum.amount ?? toMoney(0)).toFixed(2),
      paidLastMonth: (lastMonthAgg._sum.amount ?? toMoney(0)).toFixed(2),
      revenueByMonth,
    };
  }

  private async findEditableInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice "${id}" not found`);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT invoices can be edited');
    }

    return invoice;
  }
}
