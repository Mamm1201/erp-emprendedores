import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, QuotationStatus } from '../../generated/prisma/client';
import {
  calculateLineTotals,
  sumMoney,
  toMoney,
} from '../../common/utils/money.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  QUOTATION_DEFAULT_LIMIT,
  QUOTATION_DEFAULT_PAGE,
  QUOTATION_ITEM_SELECT,
  QUOTATION_SELECT,
} from './quotations.constants';
import { nextQuotationNumber } from './quotations-document.service';
import { assertStatusTransition, isEditableStatus } from './quotations.status';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QueryQuotationsDto } from './dto/query-quotations.dto';
import { QuotationItemDto } from './dto/quotation-item.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryQuotationsDto) {
    const page = query.page ?? QUOTATION_DEFAULT_PAGE;
    const limit = query.limit ?? QUOTATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        select: QUOTATION_SELECT,
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.quotation.count({ where }),
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
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...QUOTATION_SELECT,
        items: {
          select: QUOTATION_ITEM_SELECT,
          orderBy: { lineOrder: 'asc' },
        },
        workOrder: { select: { id: true, number: true, status: true } },
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with id "${id}" not found`);
    }

    return quotation;
  }

  async create(dto: CreateQuotationDto, userId: string) {
    await this.ensureActiveClient(dto.clientId);
    await this.resolveBranch(dto.clientId, dto.branchId);
    const { items, totals } = this.buildItemsPayload(dto.items);

    return this.prisma.$transaction(async (tx) => {
      const number = await nextQuotationNumber(tx);

      return tx.quotation.create({
        data: {
          number,
          clientId: dto.clientId,
          branchId: dto.branchId ?? null,
          status: QuotationStatus.DRAFT,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          notes: dto.notes,
          terms: dto.terms,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
          createdById: userId,
          items: { create: items },
        },
        select: {
          ...QUOTATION_SELECT,
          items: {
            select: QUOTATION_ITEM_SELECT,
            orderBy: { lineOrder: 'asc' },
          },
        },
      });
    });
  }

  async update(id: string, dto: UpdateQuotationDto, userId: string) {
    const quotation = await this.findEditableQuotation(id);

    if (dto.branchId) {
      await this.resolveBranch(quotation.clientId, dto.branchId);
    }

    const itemsPayload = dto.items
      ? this.buildItemsPayload(dto.items)
      : null;

    return this.prisma.$transaction(async (tx) => {
      if (itemsPayload) {
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      }

      return tx.quotation.update({
        where: { id },
        data: {
          ...(dto.branchId !== undefined && {
            branchId: dto.branchId,
          }),
          ...(dto.validUntil !== undefined && {
            validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.terms !== undefined && { terms: dto.terms }),
          updatedById: userId,
          ...(itemsPayload && {
            subtotal: itemsPayload.totals.subtotal,
            discountTotal: itemsPayload.totals.discountTotal,
            taxTotal: itemsPayload.totals.taxTotal,
            total: itemsPayload.totals.total,
            items: { create: itemsPayload.items },
          }),
        },
        select: {
          ...QUOTATION_SELECT,
          items: {
            select: QUOTATION_ITEM_SELECT,
            orderBy: { lineOrder: 'asc' },
          },
        },
      });
    });
  }

  async updateStatus(id: string, dto: UpdateQuotationStatusDto) {
    const quotation = await this.findOne(id);

    assertStatusTransition(quotation.status, dto.status);

    if (dto.status === QuotationStatus.CONVERTED) {
      throw new BadRequestException(
        'Use work order conversion flow to mark quotation as CONVERTED',
      );
    }

    if (dto.status === QuotationStatus.CANCELLED && quotation.workOrder) {
      throw new BadRequestException(
        'Cannot cancel a quotation that already has a work order',
      );
    }

    const now = new Date();
    const lifecycleData: Prisma.QuotationUpdateInput = {};

    if (dto.status === QuotationStatus.SENT) {
      lifecycleData.sentAt = now;
    } else if (dto.status === QuotationStatus.APPROVED) {
      lifecycleData.approvedAt = now;
    } else if (dto.status === QuotationStatus.REJECTED) {
      lifecycleData.rejectedAt = now;
      if (dto.notes) lifecycleData.rejectionNotes = dto.notes;
    } else if (dto.status === QuotationStatus.CANCELLED) {
      lifecycleData.cancelledAt = now;
      if (dto.notes) lifecycleData.cancellationNotes = dto.notes;
    } else if (dto.status === QuotationStatus.EXPIRED) {
      lifecycleData.cancelledAt = now;
    }

    const snapshotData =
      dto.status === QuotationStatus.SENT
        ? await this.buildCommercialSnapshotData(
            quotation.clientId,
            quotation.branchId,
          )
        : {};

    return this.prisma.quotation.update({
      where: { id },
      data: {
        status: dto.status,
        ...lifecycleData,
        ...snapshotData,
      },
      select: {
        ...QUOTATION_SELECT,
        items: {
          select: QUOTATION_ITEM_SELECT,
          orderBy: { lineOrder: 'asc' },
        },
      },
    });
  }

  async remove(id: string) {
    const quotation = await this.findOne(id);

    if (quotation.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT quotations can be soft-deleted. Use status transition to CANCELLED.',
      );
    }

    return this.prisma.quotation.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, number: true, deletedAt: true },
    });
  }

  private buildListWhere(query: QueryQuotationsDto): Prisma.QuotationWhereInput {
    const where: Prisma.QuotationWhereInput = { deletedAt: null };

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.status) {
      where.status = query.status;
    }

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
        { clientLegalName: { contains: term, mode: 'insensitive' } },
        { clientTaxId: { contains: term, mode: 'insensitive' } },
        { branchName: { contains: term, mode: 'insensitive' } },
        { notes: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildItemsPayload(items: QuotationItemDto[]) {
    const lineResults = items.map((item, index) => {
      const quantity = toMoney(item.quantity);
      const unitPrice = toMoney(item.unitPrice);
      const discountAmount = toMoney(item.discountAmount ?? 0);
      const taxRate = toMoney(item.taxRate ?? 0);

      const totals = calculateLineTotals({
        quantity,
        unitPrice,
        discountAmount,
        taxRate,
      });

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

  private async ensureActiveClient(clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, deletedAt: null },
      select: { id: true, legalName: true, taxId: true },
    });

    if (!client) {
      throw new NotFoundException(`Client with id "${clientId}" not found`);
    }

    return client;
  }

  private async resolveBranch(clientId: string, branchId?: string) {
    if (!branchId) {
      return null;
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, clientId, deletedAt: null },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        department: true,
        contactName: true,
        contactPhone: true,
      },
    });

    if (!branch) {
      throw new BadRequestException(
        `Branch "${branchId}" not found for this client`,
      );
    }

    return branch;
  }

  private async buildCommercialSnapshotData(
    clientId: string,
    branchId: string | null,
  ): Promise<Prisma.QuotationUpdateInput> {
    const client = await this.ensureActiveClient(clientId);
    const branch = branchId
      ? await this.resolveBranch(clientId, branchId)
      : null;

    return {
      clientLegalName: client.legalName,
      clientTaxId: client.taxId,
      branchName: branch?.name ?? null,
      branchAddress: branch?.address ?? null,
      branchCity: branch?.city ?? null,
      branchDepartment: branch?.department ?? null,
      branchContactName: branch?.contactName ?? null,
      branchContactPhone: branch?.contactPhone ?? null,
      snapshotAt: new Date(),
    };
  }

  private async findEditableQuotation(id: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, clientId: true, branchId: true },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with id "${id}" not found`);
    }

    if (!isEditableStatus(quotation.status)) {
      throw new BadRequestException(
        `Quotation in status ${quotation.status} cannot be edited`,
      );
    }

    return quotation;
  }
}
