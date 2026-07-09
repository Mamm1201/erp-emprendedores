import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VISIT_SELECT } from './maintenance-visits.constants';
import {
  WORK_ORDER_DOCUMENT_TYPE,
  WORK_ORDER_NUMBER_PREFIX,
} from '../work-orders/work-orders.constants';
import { nextDocumentNumber } from '../quotations/quotations-document.service';
import { CreateMaintenanceVisitDto } from './dto/create-maintenance-visit.dto';
import { UpdateMaintenanceVisitDto } from './dto/update-maintenance-visit.dto';

@Injectable()
export class MaintenanceVisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(planId: string) {
    await this.ensurePlanExists(planId);

    const visits = await this.prisma.maintenanceVisit.findMany({
      where: { planId },
      select: VISIT_SELECT,
      orderBy: { scheduledDate: 'asc' },
    });

    return { data: visits };
  }

  async findOne(planId: string, id: string) {
    await this.ensurePlanExists(planId);

    const visit = await this.prisma.maintenanceVisit.findFirst({
      where: { id, planId },
      select: VISIT_SELECT,
    });

    if (!visit) {
      throw new NotFoundException(`Visita con id "${id}" no encontrada`);
    }

    return visit;
  }

  async create(planId: string, dto: CreateMaintenanceVisitDto) {
    await this.ensurePlanExists(planId);

    return this.prisma.maintenanceVisit.create({
      data: {
        planId,
        scheduledDate: new Date(dto.scheduledDate),
        windowEnd: dto.windowEnd ? new Date(dto.windowEnd) : null,
        notes: dto.notes ?? null,
      },
      select: VISIT_SELECT,
    });
  }

  async update(planId: string, id: string, dto: UpdateMaintenanceVisitDto) {
    const visit = await this.findOne(planId, id);

    if (visit.status !== 'PENDING') {
      throw new BadRequestException(
        `Solo se pueden modificar visitas en estado PENDING (estado actual: ${visit.status})`,
      );
    }

    if (Object.keys(dto).length === 0) return visit;

    return this.prisma.maintenanceVisit.update({
      where: { id },
      data: {
        ...(dto.scheduledDate !== undefined && {
          scheduledDate: new Date(dto.scheduledDate),
        }),
        ...(dto.windowEnd !== undefined && {
          windowEnd: dto.windowEnd ? new Date(dto.windowEnd) : null,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: VISIT_SELECT,
    });
  }

  async generateWorkOrder(planId: string, id: string, userId: string) {
    const visit = await this.findOne(planId, id);

    if (visit.status !== 'PENDING') {
      throw new BadRequestException(
        `Solo se puede generar una OT desde una visita PENDING (estado actual: ${visit.status})`,
      );
    }

    // Resolve clientId from plan → contract, and planEquipment for equipmentId linking
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id: planId },
      select: {
        frequency: true,
        contract: {
          select: { clientId: true, id: true, number: true },
        },
        planEquipment: { select: { equipmentId: true } },
      },
    });

    if (!plan) throw new NotFoundException(`Plan "${planId}" no encontrado`);

    const { clientId, number: contractNumber } = plan.contract;
    const dateLabel = new Date(visit.scheduledDate)
      .toISOString()
      .slice(0, 10);
    const title = `Visita preventiva ${plan.frequency} — Contrato ${contractNumber} — ${dateLabel}`;

    return this.prisma.$transaction(async (tx) => {
      const number = await nextDocumentNumber(
        tx,
        WORK_ORDER_DOCUMENT_TYPE,
        WORK_ORDER_NUMBER_PREFIX,
      );

      const singleEquipmentId =
        plan.planEquipment.length === 1 ? plan.planEquipment[0].equipmentId : null;

      const workOrder = await tx.workOrder.create({
        data: {
          number,
          clientId,
          type: 'PREVENTIVE',
          title,
          scheduledAt: new Date(visit.scheduledDate),
          createdById: userId,
          equipmentId: singleEquipmentId,
        },
        select: { id: true, number: true, status: true },
      });

      await tx.maintenanceVisit.update({
        where: { id },
        data: {
          status: 'GENERATED',
          workOrderId: workOrder.id,
        },
      });

      return { visit: { ...visit, status: 'GENERATED', workOrder }, workOrder };
    });
  }

  async cancel(planId: string, id: string) {
    const visit = await this.findOne(planId, id);

    if (visit.status === 'COMPLETED') {
      throw new BadRequestException(
        'No se puede cancelar una visita ya completada',
      );
    }

    if (visit.status === 'CANCELLED') {
      return visit;
    }

    return this.prisma.maintenanceVisit.update({
      where: { id },
      data: { status: 'CANCELLED' },
      select: VISIT_SELECT,
    });
  }

  async remove(planId: string, id: string) {
    const visit = await this.findOne(planId, id);

    if (visit.status !== 'PENDING') {
      throw new BadRequestException(
        `Solo se pueden eliminar visitas en estado PENDING (estado actual: ${visit.status})`,
      );
    }

    await this.prisma.maintenanceVisit.delete({ where: { id } });

    return { id, deleted: true };
  }

  private async ensurePlanExists(planId: string): Promise<void> {
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id: planId },
      select: { id: true },
    });
    if (!plan) {
      throw new NotFoundException(`Plan de mantenimiento "${planId}" no encontrado`);
    }
  }
}
