import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { AttachPlanEquipmentDto } from './dto/attach-plan-equipment.dto';

const PLAN_EQUIPMENT_SELECT = {
  equipmentId: true,
  addedAt: true,
  equipment: {
    select: {
      id: true,
      type: true,
      brand: true,
      model: true,
      serialNumber: true,
      location: true,
      status: true,
      branchId: true,
      branch: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.MaintenancePlanEquipmentSelect;

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

  async findEquipment(planId: string) {
    await this.findOne(planId);

    return this.prisma.maintenancePlanEquipment.findMany({
      where: { planId },
      select: PLAN_EQUIPMENT_SELECT,
      orderBy: { addedAt: 'asc' },
    });
  }

  async attachEquipment(planId: string, dto: AttachPlanEquipmentDto) {
    const plan = await this.findOne(planId);

    // El equipo debe pertenecer ya al contrato padre (decisión congelada,
    // sesión 2026-07-12): un plan no puede cubrir equipos fuera del alcance
    // del contrato. Esto evita duplicar la validación de pertenencia al
    // cliente que ya vive en MaintenanceContractsService — aquí solo se
    // verifica membresía en ContractEquipment.
    const link = await this.prisma.contractEquipment.findUnique({
      where: {
        contractId_equipmentId: { contractId: plan.contractId, equipmentId: dto.equipmentId },
      },
      select: { id: true },
    });

    if (!link) {
      throw new BadRequestException(
        `Equipment "${dto.equipmentId}" must be associated with the contract before it can be added to a plan`,
      );
    }

    return this.prisma.maintenancePlanEquipment.create({
      data: { planId, equipmentId: dto.equipmentId },
      select: PLAN_EQUIPMENT_SELECT,
    });
  }

  async detachEquipment(planId: string, equipmentId: string) {
    await this.findOne(planId);

    const link = await this.prisma.maintenancePlanEquipment.findUnique({
      where: { planId_equipmentId: { planId, equipmentId } },
      select: { id: true },
    });

    if (!link) {
      throw new NotFoundException(
        `Equipo "${equipmentId}" no está asociado a este plan`,
      );
    }

    await this.prisma.maintenancePlanEquipment.delete({ where: { id: link.id } });

    return { planId, equipmentId, removed: true };
  }

  private buildListWhere(query: QueryMaintenancePlansDto): Prisma.MaintenancePlanWhereInput {
    const where: Prisma.MaintenancePlanWhereInput = {};

    if (query.contractId) where.contractId = query.contractId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return where;
  }
}
