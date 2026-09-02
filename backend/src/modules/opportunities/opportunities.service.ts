import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OpportunityStage, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotationsService } from '../quotations/quotations.service';
import {
  OPPORTUNITY_DEFAULT_LIMIT,
  OPPORTUNITY_DEFAULT_PAGE,
  OPPORTUNITY_SELECT,
} from './opportunities.constants';
import { assertStageTransition } from './opportunities.stage';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { UpdateOpportunityStageDto } from './dto/update-opportunity-stage.dto';
import { QueryOpportunitiesDto } from './dto/query-opportunities.dto';
import { GenerateQuotationDto } from './dto/generate-quotation.dto';

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotationsService: QuotationsService,
  ) {}

  async findAll(accountId: string, query: QueryOpportunitiesDto) {
    await this.ensureAccount(accountId);

    const page = query.page ?? OPPORTUNITY_DEFAULT_PAGE;
    const limit = query.limit ?? OPPORTUNITY_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(accountId, query);

    const [data, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        select: OPPORTUNITY_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.opportunity.count({ where }),
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

  async findOne(accountId: string, id: string) {
    await this.ensureAccount(accountId);
    return this.ensureOpportunityBelongsToAccount(accountId, id);
  }

  async create(accountId: string, dto: CreateOpportunityDto, ownerId: string) {
    await this.ensureAccount(accountId);

    if (dto.primaryContactId) {
      await this.ensureContactBelongsToAccount(accountId, dto.primaryContactId);
    }

    return this.prisma.opportunity.create({
      data: {
        accountId,
        primaryContactId: dto.primaryContactId,
        title: dto.title,
        detectedNeed: dto.detectedNeed,
        priority: dto.priority,
        source: dto.source,
        probability: dto.probability,
        potentialValue: dto.potentialValue,
        notes: dto.notes,
        ownerId,
      },
      select: OPPORTUNITY_SELECT,
    });
  }

  async update(accountId: string, id: string, dto: UpdateOpportunityDto) {
    await this.ensureOpportunityBelongsToAccount(accountId, id);

    if (dto.primaryContactId) {
      await this.ensureContactBelongsToAccount(accountId, dto.primaryContactId);
    }

    return this.prisma.opportunity.update({
      where: { id },
      data: {
        ...(dto.primaryContactId !== undefined && {
          primaryContactId: dto.primaryContactId,
        }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.detectedNeed !== undefined && {
          detectedNeed: dto.detectedNeed,
        }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.probability !== undefined && {
          probability: dto.probability,
        }),
        ...(dto.potentialValue !== undefined && {
          potentialValue: dto.potentialValue,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: OPPORTUNITY_SELECT,
    });
  }

  async updateStage(
    accountId: string,
    id: string,
    dto: UpdateOpportunityStageDto,
  ) {
    const opportunity = await this.ensureOpportunityBelongsToAccount(
      accountId,
      id,
    );

    assertStageTransition(opportunity.stage, dto.stage);

    return this.prisma.opportunity.update({
      where: { id },
      data: { stage: dto.stage },
      select: OPPORTUNITY_SELECT,
    });
  }

  // Idempotente: si ya esta vinculado, no vuelve a conectar (evita
  // depender de si Prisma trata `connect` repetido como no-op o error).
  async linkService(accountId: string, id: string, serviceId: string) {
    await this.ensureOpportunityBelongsToAccount(accountId, id);
    await this.ensureServiceExists(serviceId);

    const alreadyLinked = await this.prisma.opportunity.findFirst({
      where: { id, services: { some: { id: serviceId } } },
      select: { id: true },
    });

    if (!alreadyLinked) {
      await this.prisma.opportunity.update({
        where: { id },
        data: { services: { connect: { id: serviceId } } },
      });
    }

    return this.ensureOpportunityBelongsToAccount(accountId, id);
  }

  // disconnect sobre una relacion inexistente no produce error (borrado de
  // cero filas en la tabla de union) — idempotente por naturaleza.
  async unlinkService(accountId: string, id: string, serviceId: string) {
    await this.ensureOpportunityBelongsToAccount(accountId, id);

    await this.prisma.opportunity.update({
      where: { id },
      data: { services: { disconnect: { id: serviceId } } },
    });

    return this.ensureOpportunityBelongsToAccount(accountId, id);
  }

  // F1.8 — genera una Quotation real a partir de una Opportunity, con
  // promocion Account->Client atomica. Todo el flujo corre dentro de una
  // unica transaccion Prisma:
  //  1. Lock de la Opportunity (SELECT ... FOR UPDATE) — serializa intentos
  //     concurrentes sobre la misma Opportunity, unica forma de garantizar
  //     "una sola Quotation por Opportunity" sin constraint de DB.
  //  2. Si ya existe una Quotation vinculada -> 409.
  //  3. assertStageTransition sin modificar (stage -> QUOTED).
  //  4. Resolucion Account -> Client (promotedClientId activo, o por taxId,
  //     con 409 si el unico Client con ese taxId esta soft-deleted).
  //  5. QuotationsService.create() participando de esta misma transaccion.
  //  6-7. Vincular Quotation.opportunityId y avanzar Opportunity.stage.
  async generateQuotation(
    accountId: string,
    id: string,
    dto: GenerateQuotationDto,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string; stage: OpportunityStage }[]>`
        SELECT id, stage FROM opportunities
        WHERE id = ${id} AND "accountId" = ${accountId}
        FOR UPDATE
      `;

      if (locked.length === 0) {
        throw new NotFoundException(
          `Opportunity with id "${id}" not found for this account`,
        );
      }
      const opportunity = locked[0];

      const existingLink = await tx.quotation.findFirst({
        where: { opportunityId: id },
        select: { id: true },
      });
      if (existingLink) {
        throw new ConflictException(
          `Opportunity "${id}" already has a linked Quotation (id: ${existingLink.id})`,
        );
      }

      assertStageTransition(opportunity.stage, OpportunityStage.QUOTED);

      const account = await tx.account.findUniqueOrThrow({
        where: { id: accountId },
        select: { legalName: true, nit: true, promotedClientId: true },
      });

      let clientId: string | null = null;

      if (account.promotedClientId) {
        const existing = await tx.client.findFirst({
          where: { id: account.promotedClientId, deletedAt: null },
          select: { id: true },
        });
        if (existing) clientId = existing.id;
      }

      if (!clientId) {
        if (account.nit) {
          const activeByTaxId = await tx.client.findFirst({
            where: { taxId: account.nit, deletedAt: null },
            select: { id: true },
          });

          if (activeByTaxId) {
            clientId = activeByTaxId.id;
          } else {
            const deletedByTaxId = await tx.client.findFirst({
              where: { taxId: account.nit, deletedAt: { not: null } },
              select: { id: true },
            });

            if (deletedByTaxId) {
              throw new ConflictException(
                `A soft-deleted Client already exists with taxId "${account.nit}" ` +
                  `(id: ${deletedByTaxId.id}). Resolve manually before generating a Quotation for this Account.`,
              );
            }
          }
        }

        if (!clientId) {
          const created = await tx.client.create({
            data: { legalName: account.legalName, taxId: account.nit },
            select: { id: true },
          });
          clientId = created.id;
        }

        await tx.account.update({
          where: { id: accountId },
          data: { promotedClientId: clientId },
        });
      }

      const quotation = await this.quotationsService.create(
        { ...dto, clientId },
        userId,
        tx,
      );

      await tx.quotation.update({
        where: { id: quotation.id },
        data: { opportunityId: id },
      });

      await tx.opportunity.update({
        where: { id },
        data: { stage: OpportunityStage.QUOTED },
      });

      return { ...quotation, opportunityId: id };
    });
  }

  private async ensureServiceExists(serviceId: string): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException(`Service with id "${serviceId}" not found`);
    }
  }

  private buildWhere(
    accountId: string,
    query: QueryOpportunitiesDto,
  ): Prisma.OpportunityWhereInput {
    const where: Prisma.OpportunityWhereInput = { accountId };

    if (query.stage) {
      where.stage = query.stage;
    }

    if (query.search?.trim()) {
      where.title = { contains: query.search.trim(), mode: 'insensitive' };
    }

    return where;
  }

  private async ensureAccount(accountId: string): Promise<void> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException(`Account with id "${accountId}" not found`);
    }
  }

  // A diferencia de Contact.branchId (F1.4), aqui Contact.accountId y
  // Opportunity.accountId son directamente comparables — se valida
  // pertenencia real, no solo existencia.
  private async ensureContactBelongsToAccount(
    accountId: string,
    contactId: string,
  ): Promise<void> {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, accountId },
      select: { id: true },
    });

    if (!contact) {
      throw new NotFoundException(
        `Contact with id "${contactId}" not found for this account`,
      );
    }
  }

  // La query esta scopeada por accountId Y id a la vez — una Opportunity
  // de otra Account nunca se encuentra por su sola id.
  private async ensureOpportunityBelongsToAccount(
    accountId: string,
    id: string,
  ) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id, accountId },
      select: OPPORTUNITY_SELECT,
    });

    if (!opportunity) {
      throw new NotFoundException(
        `Opportunity with id "${id}" not found for this account`,
      );
    }

    return opportunity;
  }
}
