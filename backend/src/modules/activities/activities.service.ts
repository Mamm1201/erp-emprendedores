import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ACTIVITY_DEFAULT_LIMIT,
  ACTIVITY_DEFAULT_PAGE,
  ACTIVITY_SELECT,
} from './activities.constants';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(accountId: string, query: QueryActivitiesDto) {
    await this.ensureAccount(accountId);

    const page = query.page ?? ACTIVITY_DEFAULT_PAGE;
    const limit = query.limit ?? ACTIVITY_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(accountId, query);

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        select: ACTIVITY_SELECT,
        orderBy: { occurredAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activity.count({ where }),
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
    return this.ensureActivityBelongsToAccount(accountId, id);
  }

  async create(accountId: string, dto: CreateActivityDto, createdById: string) {
    await this.ensureAccount(accountId);

    if (dto.opportunityId) {
      await this.ensureOpportunityBelongsToAccount(accountId, dto.opportunityId);
    }

    if (dto.contactId) {
      await this.ensureContactBelongsToAccount(accountId, dto.contactId);
    }

    return this.prisma.activity.create({
      data: {
        accountId,
        opportunityId: dto.opportunityId,
        contactId: dto.contactId,
        type: dto.type,
        status: dto.status,
        occurredAt: new Date(dto.occurredAt),
        summary: dto.summary,
        outcome: dto.outcome,
        aiGenerated: dto.aiGenerated,
        createdById,
      },
      select: ACTIVITY_SELECT,
    });
  }

  async update(accountId: string, id: string, dto: UpdateActivityDto) {
    await this.ensureActivityBelongsToAccount(accountId, id);

    if (dto.opportunityId) {
      await this.ensureOpportunityBelongsToAccount(accountId, dto.opportunityId);
    }

    if (dto.contactId) {
      await this.ensureContactBelongsToAccount(accountId, dto.contactId);
    }

    return this.prisma.activity.update({
      where: { id },
      data: {
        ...(dto.opportunityId !== undefined && {
          opportunityId: dto.opportunityId,
        }),
        ...(dto.contactId !== undefined && { contactId: dto.contactId }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.occurredAt !== undefined && {
          occurredAt: new Date(dto.occurredAt),
        }),
        ...(dto.summary !== undefined && { summary: dto.summary }),
        ...(dto.outcome !== undefined && { outcome: dto.outcome }),
        ...(dto.aiGenerated !== undefined && {
          aiGenerated: dto.aiGenerated,
        }),
      },
      select: ACTIVITY_SELECT,
    });
  }

  private buildWhere(
    accountId: string,
    query: QueryActivitiesDto,
  ): Prisma.ActivityWhereInput {
    const where: Prisma.ActivityWhereInput = { accountId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      where.summary = { contains: query.search.trim(), mode: 'insensitive' };
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

  // Opportunity.accountId debe coincidir exactamente con el accountId de
  // la Activity — misma pertenencia real ya usada en F1.5.
  private async ensureOpportunityBelongsToAccount(
    accountId: string,
    opportunityId: string,
  ): Promise<void> {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id: opportunityId, accountId },
      select: { id: true },
    });

    if (!opportunity) {
      throw new NotFoundException(
        `Opportunity with id "${opportunityId}" not found for this account`,
      );
    }
  }

  // Contact.accountId debe coincidir exactamente con el accountId de la
  // Activity — misma pertenencia real ya usada en F1.4/F1.5.
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

  // La query esta scopeada por accountId Y id a la vez — una Activity de
  // otra Account nunca se encuentra por su sola id.
  private async ensureActivityBelongsToAccount(accountId: string, id: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, accountId },
      select: ACTIVITY_SELECT,
    });

    if (!activity) {
      throw new NotFoundException(
        `Activity with id "${id}" not found for this account`,
      );
    }

    return activity;
  }
}
