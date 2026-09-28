import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import {
  businessDate,
  monthStart,
  periodEndOf,
  planPeriods,
} from '../maintenance-visits/maintenance-visits.domain';

const PLAN_EQUIPMENT_SELECT = {
  equipmentId: true,
  addedAt: true,
  removedAt: true,
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
        orderBy: { firstPeriodStart: 'asc' },
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

  // Visitas abiertas cuyo periodo empieza dentro de los proximos `days` dias
  // (o ya empezo). El plazo se mide contra periodEnd, no contra scheduledDate.
  async findUpcoming(days: number = 30) {
    const today = businessDate(new Date());
    const until = new Date(today.getTime() + days * 86_400_000);

    const data = await this.prisma.maintenanceVisit.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        periodStart: { lte: until },
        plan: { isActive: true },
      },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        scheduledDate: true,
        status: true,
        plan: {
          select: {
            id: true,
            frequency: true,
            branch: { select: { id: true, name: true } },
            contract: {
              select: {
                client: { select: { legalName: true, tradeName: true } },
              },
            },
          },
        },
      },
      orderBy: [{ periodEnd: 'asc' }, { scheduledDate: 'asc' }],
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
      select: { id: true, clientId: true },
    });

    if (!contract) {
      throw new NotFoundException(
        `MaintenanceContract with id "${dto.contractId}" not found`,
      );
    }

    await this.assertBranchOfClient(dto.branchId, contract.clientId);

    const plan = await this.prisma.maintenancePlan.create({
      data: {
        contractId: dto.contractId,
        branchId: dto.branchId,
        frequency: dto.frequency,
        firstPeriodStart: monthStart(
          new Date(dto.firstPeriodStart.slice(0, 10)),
        ),
        isActive: dto.isActive ?? true,
        notes: dto.notes ?? null,
      },
      select: { id: true },
    });

    await this.syncVisits(plan.id);
    return this.findOne(plan.id);
  }

  async update(id: string, dto: UpdateMaintenancePlanDto) {
    const current = await this.findOne(id);

    if (Object.keys(dto).length === 0) {
      return current;
    }

    const newAnchor = dto.firstPeriodStart
      ? monthStart(new Date(dto.firstPeriodStart.slice(0, 10)))
      : undefined;
    const cycleChanged =
      (dto.frequency !== undefined && dto.frequency !== current.frequency) ||
      (newAnchor !== undefined &&
        newAnchor.getTime() !== current.firstPeriodStart.getTime());

    await this.prisma.$transaction(async (tx) => {
      await tx.maintenancePlan.update({
        where: { id },
        data: {
          ...(dto.frequency !== undefined && { frequency: dto.frequency }),
          ...(newAnchor !== undefined && { firstPeriodStart: newAnchor }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
      });

      // C7 / R4: el nuevo ciclo solo reemplaza visitas que no han empezado.
      if (cycleChanged) {
        await tx.maintenanceVisit.deleteMany({
          where: this.futureUntouchedVisits(id),
        });
      }
    });

    await this.syncVisits(id);
    return this.findOne(id);
  }

  /**
   * Genera las visitas faltantes del plan (seccion 5). Idempotente: la
   * restriccion unica (planId, periodStart) impide duplicados. No hace nada
   * si el plan esta inactivo. Nunca crea periodos ya terminados.
   */
  async syncVisits(planId: string) {
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        isActive: true,
        frequency: true,
        firstPeriodStart: true,
        contract: {
          select: { startDate: true, endDate: true, deletedAt: true },
        },
        planEquipment: {
          where: { removedAt: null },
          select: { equipmentId: true },
        },
        visits: { select: { periodStart: true } },
      },
    });

    if (!plan)
      throw new NotFoundException(
        `MaintenancePlan with id "${planId}" not found`,
      );
    if (!plan.isActive || plan.contract.deletedAt)
      return { planId, created: 0 };

    const existing = new Set(plan.visits.map((v) => v.periodStart.getTime()));
    const missing = planPeriods({
      firstPeriodStart: plan.firstPeriodStart,
      frequency: plan.frequency,
      contractStart: plan.contract.startDate,
      contractEnd: plan.contract.endDate,
      notBefore: new Date(),
    }).filter((p) => !existing.has(p.getTime()));

    await this.prisma.$transaction(
      missing.map((periodStart) =>
        this.prisma.maintenanceVisit.create({
          data: {
            planId,
            periodStart,
            periodEnd: periodEndOf(periodStart),
            scheduledDate: periodStart,
            // R3: foto de los equipos activos del plan.
            equipment: {
              create: plan.planEquipment.map((pe) => ({
                equipmentId: pe.equipmentId,
              })),
            },
          },
        }),
      ),
    );

    return { planId, created: missing.length };
  }

  async findEquipment(planId: string) {
    await this.findOne(planId);

    return this.prisma.maintenancePlanEquipment.findMany({
      where: { planId, removedAt: null },
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
        contractId_equipmentId: {
          contractId: plan.contractId,
          equipmentId: dto.equipmentId,
        },
      },
      select: { equipment: { select: { branchId: true } } },
    });

    if (!link) {
      throw new BadRequestException(
        `Equipment "${dto.equipmentId}" must be associated with the contract before it can be added to a plan`,
      );
    }

    // R1: un plan es de una sola sede.
    if (link.equipment.branchId !== plan.branchId) {
      throw new BadRequestException(
        'El equipo no pertenece a la sede del plan.',
      );
    }

    const existing = await this.prisma.maintenancePlanEquipment.findUnique({
      where: { planId_equipmentId: { planId, equipmentId: dto.equipmentId } },
      select: { id: true, removedAt: true },
    });

    if (existing && !existing.removedAt) {
      throw new ConflictException('El equipo ya está incluido en el plan.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Volver a incluir un equipo dado de baja reutiliza su fila.
      const planEquipment = existing
        ? await tx.maintenancePlanEquipment.update({
            where: { id: existing.id },
            data: { removedAt: null },
            select: PLAN_EQUIPMENT_SELECT,
          })
        : await tx.maintenancePlanEquipment.create({
            data: { planId, equipmentId: dto.equipmentId },
            select: PLAN_EQUIPMENT_SELECT,
          });

      // R4: propagar a visitas no iniciadas (periodo en curso o futuro).
      const targetVisits = await tx.maintenanceVisit.findMany({
        where: this.equipmentPropagationTargets(planId),
        select: { id: true },
      });
      await tx.maintenanceVisitEquipment.createMany({
        data: targetVisits.map((v) => ({
          visitId: v.id,
          equipmentId: dto.equipmentId,
        })),
        skipDuplicates: true,
      });

      return planEquipment;
    });
  }

  async detachEquipment(planId: string, equipmentId: string) {
    await this.findOne(planId);

    const link = await this.prisma.maintenancePlanEquipment.findUnique({
      where: { planId_equipmentId: { planId, equipmentId } },
      select: { id: true, removedAt: true },
    });

    if (!link || link.removedAt) {
      throw new NotFoundException(
        `Equipo "${equipmentId}" no está asociado a este plan`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Baja logica: se conserva que el equipo estuvo en el programa.
      await tx.maintenancePlanEquipment.update({
        where: { id: link.id },
        data: { removedAt: new Date() },
      });

      // R4: sale solo de visitas no iniciadas. Una visita iniciada o cerrada
      // conserva su composicion (baja durante el periodo -> el equipo se
      // resuelve NOT_ATTENDED / DECOMMISSIONED en esa visita).
      await tx.maintenanceVisitEquipment.deleteMany({
        where: {
          equipmentId,
          visit: this.equipmentPropagationTargets(planId),
        },
      });
    });

    return { planId, equipmentId, removed: true };
  }

  /**
   * R4 — visitas que reciben la propagacion de equipos del plan: periodo en
   * curso o futuro, PENDING, sin OT y sin intervenciones registradas. Una
   * visita cuya ejecucion ya empezo nunca se modifica retroactivamente.
   */
  private equipmentPropagationTargets(
    planId: string,
  ): Prisma.MaintenanceVisitWhereInput {
    return {
      planId,
      status: 'PENDING',
      workOrderId: null,
      periodEnd: { gte: businessDate(new Date()) },
      equipment: { none: { interventionId: { not: null } } },
    };
  }

  /**
   * C7 — visitas que se regeneran al cambiar ancla o frecuencia: solo las que
   * aun no empiezan su periodo, PENDING y sin OT.
   */
  private futureUntouchedVisits(
    planId: string,
  ): Prisma.MaintenanceVisitWhereInput {
    return {
      planId,
      status: 'PENDING',
      workOrderId: null,
      periodStart: { gt: businessDate(new Date()) },
    };
  }

  private async assertBranchOfClient(branchId: string, clientId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, clientId, deletedAt: null },
      select: { id: true },
    });

    if (!branch) {
      throw new BadRequestException(
        'La sede no pertenece al cliente del contrato.',
      );
    }
  }

  private buildListWhere(
    query: QueryMaintenancePlansDto,
  ): Prisma.MaintenancePlanWhereInput {
    const where: Prisma.MaintenancePlanWhereInput = {};

    if (query.contractId) where.contractId = query.contractId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return where;
  }
}
