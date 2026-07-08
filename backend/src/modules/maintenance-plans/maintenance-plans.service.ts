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
        orderBy: { startDate: 'asc' },
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

    const data = await this.prisma.maintenanceVisit.findMany({
      where: {
        status: 'PENDING',
        scheduledDate: { gte: today, lte: until },
        plan: { isActive: true },
      },
      select: {
        id: true,
        scheduledDate: true,
        status: true,
        plan: {
          select: {
            id: true,
            frequency: true,
            contract: {
              select: {
                client: { select: { legalName: true, tradeName: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 50,
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
    const contract = await this.prisma.maintenanceContract.findFirst({
      where: { id: dto.contractId, deletedAt: null },
      select: { id: true },
    });

    if (!contract) {
      throw new NotFoundException(`MaintenanceContract with id "${dto.contractId}" not found`);
    }

    return this.prisma.maintenancePlan.create({
      data: {
        contractId: dto.contractId,
        frequency: dto.frequency,
        startDate: new Date(dto.startDate),
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
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: MAINTENANCE_PLAN_SELECT,
    });
  }

  private buildListWhere(query: QueryMaintenancePlansDto): Prisma.MaintenancePlanWhereInput {
    const where: Prisma.MaintenancePlanWhereInput = {};

    if (query.contractId) where.contractId = query.contractId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return where;
  }
}
