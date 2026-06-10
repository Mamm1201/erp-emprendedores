import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MAINTENANCE_PLAN_DEFAULT_LIMIT,
  MAINTENANCE_PLAN_DEFAULT_PAGE,
  MAINTENANCE_PLAN_SELECT,
} from './maintenance-plans.constants';
import { CreateMaintenancePlanDto } from './dto/create-maintenance-plan.dto';
import { QueryMaintenancePlansDto } from './dto/query-maintenance-plans.dto';
import { UpdateMaintenancePlanDto } from './dto/update-maintenance-plan.dto';

@Injectable()
export class MaintenancePlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryMaintenancePlansDto) {
    const page = query.page ?? MAINTENANCE_PLAN_DEFAULT_PAGE;
    const limit = query.limit ?? MAINTENANCE_PLAN_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.maintenancePlan.findMany({
        where,
        select: MAINTENANCE_PLAN_SELECT,
        orderBy: { nextVisitDate: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.maintenancePlan.count({ where }),
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

  async findUpcoming(days: number = 30) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const until = new Date(today);
    until.setDate(until.getDate() + days);

    const data = await this.prisma.maintenancePlan.findMany({
      where: {
        isActive: true,
        nextVisitDate: { gte: today, lte: until },
      },
      select: MAINTENANCE_PLAN_SELECT,
      orderBy: { nextVisitDate: 'asc' },
    });

    return { data, meta: { days, from: today, until } };
  }

  async findOne(id: string) {
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id },
      select: MAINTENANCE_PLAN_SELECT,
    });

    if (!plan) {
      throw new NotFoundException(`MaintenancePlan with id "${id}" not found`);
    }

    return plan;
  }

  async create(dto: CreateMaintenancePlanDto) {
    await this.ensureActiveClient(dto.clientId);
    await this.resolveBranch(dto.clientId, dto.branchId);

    return this.prisma.maintenancePlan.create({
      data: {
        clientId: dto.clientId,
        branchId: dto.branchId ?? null,
        frequency: dto.frequency,
        contractStartDate: new Date(dto.contractStartDate),
        contractEndDate: dto.contractEndDate ? new Date(dto.contractEndDate) : null,
        nextVisitDate: new Date(dto.nextVisitDate),
        isActive: dto.isActive ?? true,
        notes: dto.notes ?? null,
      },
      select: MAINTENANCE_PLAN_SELECT,
    });
  }

  async update(id: string, dto: UpdateMaintenancePlanDto) {
    await this.findOne(id);

    if (Object.keys(dto).length === 0) {
      return this.findOne(id);
    }

    return this.prisma.maintenancePlan.update({
      where: { id },
      data: {
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.contractStartDate !== undefined && {
          contractStartDate: new Date(dto.contractStartDate),
        }),
        ...(dto.contractEndDate !== undefined && {
          contractEndDate: dto.contractEndDate ? new Date(dto.contractEndDate) : null,
        }),
        ...(dto.nextVisitDate !== undefined && {
          nextVisitDate: new Date(dto.nextVisitDate),
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: MAINTENANCE_PLAN_SELECT,
    });
  }

  private buildListWhere(
    query: QueryMaintenancePlansDto,
  ): Prisma.MaintenancePlanWhereInput {
    const where: Prisma.MaintenancePlanWhereInput = {};

    if (query.clientId) where.clientId = query.clientId;
    if (query.branchId) where.branchId = query.branchId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return where;
  }

  private async ensureActiveClient(clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, deletedAt: null },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException(`Client with id "${clientId}" not found`);
    }
  }

  private async resolveBranch(
    clientId: string,
    branchId?: string,
  ): Promise<void> {
    if (!branchId) return;

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, clientId, deletedAt: null },
      select: { id: true },
    });

    if (!branch) {
      throw new NotFoundException(
        `Branch "${branchId}" not found for this client`,
      );
    }
  }
}
