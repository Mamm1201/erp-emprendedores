import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OpportunityStage,
  Prisma,
  QuotationStatus,
  RetentionConcept,
} from '../../generated/prisma/client';
import {
  calculateLineTotals,
  roundMoney,
  sumMoney,
  toMoney,
} from '../../common/utils/money.util';
import { PrismaService } from '../../prisma/prisma.service';
import { RetentionRatesService } from '../retention-rates/retention-rates.service';
import {
  QUOTATION_DEFAULT_LIMIT,
  QUOTATION_DEFAULT_PAGE,
  QUOTATION_ITEM_SELECT,
  QUOTATION_RETENTION_LINE_SELECT,
  QUOTATION_SELECT,
} from './quotations.constants';
import { nextQuotationNumber } from './quotations-document.service';
import { assertStatusTransition, isEditableStatus } from './quotations.status';
// Funcion pura, sin DI/estado — reutilizada tal cual (sin modificarla) para
// decidir si Quotation.APPROVED puede completar automaticamente su
// Opportunity vinculada. No introduce dependencia de modulo/runtime con
// OpportunitiesModule (Contrato de implementacion WON automatico, 2026-09-02).
import { isTerminalStage } from '../opportunities/opportunities.stage';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QueryQuotationsDto } from './dto/query-quotations.dto';
import { QuotationItemDto } from './dto/quotation-item.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';

// Cliente de DB usado por create() y sus helpers: this.prisma por defecto,
// o el Prisma.TransactionClient de una transaccion externa (F1.8 —
// OpportunitiesService.generateQuotation) cuando se pasa explicitamente.
type Db = PrismaService | Prisma.TransactionClient;

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retentionRatesService: RetentionRatesService,
  ) {}

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
        retentionLines: { select: QUOTATION_RETENTION_LINE_SELECT },
        workOrder: { select: { id: true, number: true, status: true } },
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with id "${id}" not found`);
    }

    return quotation;
  }

  // tx opcional (F1.8): si se pasa, create() participa en la transaccion
  // externa del llamador en vez de abrir la suya propia — usado por
  // OpportunitiesService.generateQuotation() para atomicidad Account/Client/
  // Quotation/Opportunity. Sin tx, comportamiento identico al actual.
  async create(
    dto: CreateQuotationDto,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db: Db = tx ?? this.prisma;
    await this.ensureActiveClient(dto.clientId, db);
    const branch = await this.resolveBranch(dto.clientId, dto.branchId, db);
    const { items, totals } = this.buildItemsPayload(dto.items);

    const retentionsApplied = dto.retentionsApplied ?? false;
    const retentionLines = retentionsApplied
      ? await this.buildRetentionLinesPayload({
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          branchCity: branch?.city ?? null,
          asOf: new Date(),
        })
      : [];

    const run = async (client: Prisma.TransactionClient) => {
      const number = await nextQuotationNumber(client);

      return client.quotation.create({
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
          retentionsApplied,
          createdById: userId,
          items: { create: items },
          retentionLines: { create: retentionLines },
        },
        select: {
          ...QUOTATION_SELECT,
          items: {
            select: QUOTATION_ITEM_SELECT,
            orderBy: { lineOrder: 'asc' },
          },
          retentionLines: { select: QUOTATION_RETENTION_LINE_SELECT },
        },
      });
    };

    if (tx) return run(tx);
    return this.prisma.$transaction(run);
  }

  async update(id: string, dto: UpdateQuotationDto, userId: string) {
    const quotation = await this.findEditableQuotation(id);

    let branchCity = quotation.branch?.city ?? null;
    if (dto.branchId) {
      const branch = await this.resolveBranch(quotation.clientId, dto.branchId);
      branchCity = branch?.city ?? null;
    } else if (dto.branchId === null) {
      branchCity = null;
    }

    const itemsPayload = dto.items
      ? this.buildItemsPayload(dto.items)
      : null;

    // Retenciones: recalculables mientras la cotización sigue en DRAFT — no
    // son un snapshot definitivo todavía (eso ocurre solo al pasar a SENT).
    const retentionsApplied = dto.retentionsApplied ?? quotation.retentionsApplied;
    const effectiveSubtotal = itemsPayload
      ? itemsPayload.totals.subtotal
      : toMoney(quotation.subtotal);
    const effectiveDiscountTotal = itemsPayload
      ? itemsPayload.totals.discountTotal
      : toMoney(quotation.discountTotal);
    const retentionLines = retentionsApplied
      ? await this.buildRetentionLinesPayload({
          subtotal: effectiveSubtotal,
          discountTotal: effectiveDiscountTotal,
          branchCity,
          asOf: new Date(),
        })
      : [];

    return this.prisma.$transaction(async (tx) => {
      if (itemsPayload) {
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      }
      await tx.quotationRetentionLine.deleteMany({ where: { quotationId: id } });

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
          ...(dto.retentionsApplied !== undefined && { retentionsApplied }),
          retentionLines: { create: retentionLines },
        },
        select: {
          ...QUOTATION_SELECT,
          items: {
            select: QUOTATION_ITEM_SELECT,
            orderBy: { lineOrder: 'asc' },
          },
          retentionLines: { select: QUOTATION_RETENTION_LINE_SELECT },
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

    const selectPayload = {
      ...QUOTATION_SELECT,
      items: {
        select: QUOTATION_ITEM_SELECT,
        orderBy: { lineOrder: 'asc' as const },
      },
      retentionLines: { select: QUOTATION_RETENTION_LINE_SELECT },
    };

    // Congelamiento definitivo de las retenciones al pasar a SENT: mismo
    // instante y mecanismo que ya congela clientLegalName/branchCity
    // (buildCommercialSnapshotData). A partir de aquí la cotización deja de
    // ser editable (isEditableStatus), así que estas líneas quedan aisladas
    // de cualquier cambio posterior en RetentionRate.
    if (dto.status === QuotationStatus.SENT && quotation.retentionsApplied) {
      const branchCity =
        'branchCity' in snapshotData ? (snapshotData.branchCity as string | null) : null;
      const retentionLines = await this.buildRetentionLinesPayload({
        subtotal: toMoney(quotation.subtotal),
        discountTotal: toMoney(quotation.discountTotal),
        branchCity,
        asOf: new Date(),
      });

      return this.prisma.$transaction(async (tx) => {
        await tx.quotationRetentionLine.deleteMany({ where: { quotationId: id } });

        return tx.quotation.update({
          where: { id },
          data: {
            status: dto.status,
            ...lifecycleData,
            ...snapshotData,
            retentionLines: { create: retentionLines },
          },
          select: selectPayload,
        });
      });
    }

    // CRM (F1.1-F1.8): si esta Quotation esta vinculada a una Opportunity,
    // su aprobacion completa automaticamente el negocio (WON), salvo que la
    // Opportunity ya este en un estado terminal (WON: no-op idempotente;
    // LOST: se conserva LOST a proposito, sin reabrirla — la aprobacion de
    // la Quotation nunca se bloquea por esto). Lectura de opportunityId
    // localizada aqui a proposito: QUOTATION_SELECT no se toca, por lo que
    // ningun endpoint existente cambia su forma de respuesta. Quotations sin
    // opportunityId (el 100% de las anteriores a F1.1, y cualquiera creada
    // por el flujo tradicional) nunca entran a este bloque.
    if (dto.status === QuotationStatus.APPROVED) {
      const link = await this.prisma.quotation.findUnique({
        where: { id },
        select: { opportunityId: true },
      });

      if (link?.opportunityId) {
        const opportunityId = link.opportunityId;

        return this.prisma.$transaction(async (tx) => {
          const opportunity = await tx.opportunity.findUniqueOrThrow({
            where: { id: opportunityId },
            select: { stage: true },
          });

          if (!isTerminalStage(opportunity.stage)) {
            await tx.opportunity.update({
              where: { id: opportunityId },
              data: { stage: OpportunityStage.WON },
            });
          }

          return tx.quotation.update({
            where: { id },
            data: {
              status: dto.status,
              ...lifecycleData,
              ...snapshotData,
            },
            select: selectPayload,
          });
        });
      }
    }

    return this.prisma.quotation.update({
      where: { id },
      data: {
        status: dto.status,
        ...lifecycleData,
        ...snapshotData,
      },
      select: selectPayload,
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

    if (query.opportunityId) {
      where.opportunityId = query.opportunityId;
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

  // Dominio Retenciones (independiente del cálculo de IVA de arriba). Base de
  // retención = subtotal − descuentos, SIN IVA. RETE FUENTE es siempre
  // nacional (municipalityCode null); RETE ICA depende exclusivamente del
  // DIVIPOLA resuelto vía MunicipalityAlias a partir de la ciudad de la sede.
  // Si no hay alias configurado para esa ciudad, o no hay tarifa vigente para
  // un concepto (p. ej. Facatativá hoy), esa línea simplemente no se genera
  // — nunca se asume una jurisdicción ni una tarifa por defecto.
  private async buildRetentionLinesPayload(params: {
    subtotal: Prisma.Decimal;
    discountTotal: Prisma.Decimal;
    branchCity: string | null;
    asOf: Date;
  }): Promise<Prisma.QuotationRetentionLineCreateWithoutQuotationInput[]> {
    const base = roundMoney(params.subtotal.sub(params.discountTotal));
    if (base.lte(0)) return [];

    const icaMunicipalityCode = params.branchCity
      ? await this.retentionRatesService.resolveMunicipalityCode(params.branchCity)
      : null;

    const targets: { concept: RetentionConcept; municipalityCode: string | null }[] = [
      { concept: RetentionConcept.RETE_FUENTE, municipalityCode: null },
      { concept: RetentionConcept.RETE_ICA, municipalityCode: icaMunicipalityCode },
    ];

    const lines: Prisma.QuotationRetentionLineCreateWithoutQuotationInput[] = [];

    for (const target of targets) {
      if (target.concept === RetentionConcept.RETE_ICA && !target.municipalityCode) {
        continue; // sin jurisdicción determinable (sede no seleccionada o ciudad sin alias configurado)
      }

      const rate = await this.retentionRatesService.resolveRate(
        target.concept,
        target.municipalityCode,
        params.asOf,
      );
      if (!rate) continue; // sin tarifa vigente configurada — no se asume 0%

      if (rate.minimumBaseUvt && rate.uvtValueSnapshot) {
        const minimumBase = toMoney(rate.minimumBaseUvt).mul(toMoney(rate.uvtValueSnapshot));
        if (base.lt(minimumBase)) continue; // bajo la base mínima — no se practica retención
      }

      const common = {
        concept: target.concept,
        municipalityCodeSnapshot: target.municipalityCode,
        taxpayerConditionSnapshot: rate.taxpayerConditionNote,
        legalSourceSnapshot: rate.legalSource,
      };

      if (rate.rate !== null) {
        // Tarifa puntual — caso hoy vigente (RETE FUENTE 6%, RETE ICA Bogotá 9,66‰).
        lines.push({
          ...common,
          rateSnapshot: rate.rate,
          estimatedAmount: roundMoney(base.mul(toMoney(rate.rate)).div(100)),
        });
      } else if (rate.rateMin !== null && rate.rateMax !== null) {
        // Rango — cuando la norma municipal no permite fijar un único valor.
        lines.push({
          ...common,
          rateMinSnapshot: rate.rateMin,
          rateMaxSnapshot: rate.rateMax,
          estimatedAmountMin: roundMoney(base.mul(toMoney(rate.rateMin)).div(100)),
          estimatedAmountMax: roundMoney(base.mul(toMoney(rate.rateMax)).div(100)),
        });
      }
      // Si ninguna rama aplica, la fila de RetentionRate viola el invariante
      // punto-o-rango protegido por CHECK en BD — no debería ocurrir; se
      // ignora defensivamente sin generar una línea inconsistente.
    }

    return lines;
  }

  private async ensureActiveClient(clientId: string, db: Db = this.prisma) {
    const client = await db.client.findFirst({
      where: { id: clientId, deletedAt: null },
      select: { id: true, legalName: true, taxId: true },
    });

    if (!client) {
      throw new NotFoundException(`Client with id "${clientId}" not found`);
    }

    return client;
  }

  private async resolveBranch(
    clientId: string,
    branchId?: string,
    db: Db = this.prisma,
  ) {
    if (!branchId) {
      return null;
    }

    const branch = await db.branch.findFirst({
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
      select: {
        id: true,
        status: true,
        clientId: true,
        branchId: true,
        subtotal: true,
        discountTotal: true,
        retentionsApplied: true,
        branch: { select: { city: true } },
      },
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
