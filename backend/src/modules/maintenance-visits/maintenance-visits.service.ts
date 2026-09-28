import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VisitEquipmentStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  VISIT_EQUIPMENT_SELECT,
  VISIT_SELECT,
} from './maintenance-visits.constants';
import {
  WORK_ORDER_DOCUMENT_TYPE,
  WORK_ORDER_NUMBER_PREFIX,
} from '../work-orders/work-orders.constants';
import { nextDocumentNumber } from '../quotations/quotations-document.service';
import { UpdateMaintenanceVisitDto } from './dto/update-maintenance-visit.dto';
import {
  CancelVisitDto,
  EarlyExecutionNoteDto,
  MarkNotAttendedDto,
} from './dto/visit-equipment.dto';
import { reconcileForClose, visitDeadline } from './maintenance-visits.domain';

const PERIOD_LABEL = new Intl.DateTimeFormat('es-CO', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

@Injectable()
export class MaintenanceVisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(planId: string) {
    await this.ensurePlanExists(planId);

    const visits = await this.prisma.maintenanceVisit.findMany({
      where: { planId },
      select: VISIT_SELECT,
      orderBy: { periodStart: 'asc' },
    });

    return { data: visits.map((v) => this.withDeadline(v)) };
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

    return this.withDeadline(visit);
  }

  async update(planId: string, id: string, dto: UpdateMaintenanceVisitDto) {
    const visit = await this.findOne(planId, id);
    this.assertOpen(visit.status);

    if (Object.keys(dto).length === 0) return visit;

    await this.prisma.maintenanceVisit.update({
      where: { id },
      data: {
        ...(dto.scheduledDate !== undefined && {
          scheduledDate: new Date(dto.scheduledDate.slice(0, 10)),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.findOne(planId, id);
  }

  // PENDING -> IN_PROGRESS. Se permite antes del periodo (ejecucion anticipada).
  async generateWorkOrder(planId: string, id: string, userId: string) {
    const visit = await this.findOne(planId, id);

    if (visit.status !== 'PENDING') {
      throw new BadRequestException(
        `Solo se puede generar una OT desde una visita PENDING (estado actual: ${visit.status})`,
      );
    }

    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id: planId },
      select: {
        frequency: true,
        branchId: true,
        branch: { select: { name: true } },
        contract: { select: { clientId: true, number: true } },
      },
    });

    if (!plan) throw new NotFoundException(`Plan "${planId}" no encontrado`);

    const title = `Visita preventiva ${plan.frequency} — Sede ${plan.branch.name} — ${PERIOD_LABEL.format(visit.periodStart)} — Contrato ${plan.contract.number}`;

    return this.prisma.$transaction(async (tx) => {
      const number = await nextDocumentNumber(
        tx,
        WORK_ORDER_DOCUMENT_TYPE,
        WORK_ORDER_NUMBER_PREFIX,
      );

      // OT de sede: sin equipo (D-6); la trazabilidad va por Intervention.
      const workOrder = await tx.workOrder.create({
        data: {
          number,
          clientId: plan.contract.clientId,
          branchId: plan.branchId,
          type: 'PREVENTIVE',
          title,
          scheduledAt: visit.scheduledDate,
          createdById: userId,
        },
        select: { id: true, number: true, status: true },
      });

      await tx.maintenanceVisit.update({
        where: { id },
        data: { status: 'IN_PROGRESS', workOrderId: workOrder.id },
      });

      return {
        visit: { ...visit, status: 'IN_PROGRESS', workOrder },
        workOrder,
      };
    });
  }

  // PENDING -> CLOSED sin ejecucion: todos los equipos NOT_ATTENDED (R11).
  async closeWithoutExecution(planId: string, id: string) {
    const visit = await this.findOne(planId, id);

    if (visit.status !== 'PENDING' || visit.workOrder) {
      throw new BadRequestException(
        'Solo se puede cerrar sin ejecución una visita PENDING sin OT. Si tiene OT, cancélala primero.',
      );
    }

    const compliance = reconcileForClose(visit);

    await this.prisma.maintenanceVisit.update({
      where: { id },
      data: { status: 'CLOSED', compliance, closedAt: new Date() },
    });

    return this.findOne(planId, id);
  }

  // PENDING -> CANCELLED: la obligacion desaparece (contrato terminado o plan
  // desactivado). No es la forma de cerrar una visita no ejecutada.
  async cancel(planId: string, id: string, dto: CancelVisitDto) {
    const visit = await this.findOne(planId, id);

    if (visit.status !== 'PENDING' || visit.workOrder) {
      throw new BadRequestException(
        'Solo se puede cancelar una visita PENDING sin OT.',
      );
    }

    await this.prisma.maintenanceVisit.update({
      where: { id },
      data: { status: 'CANCELLED', cancelReason: dto.reason.trim() },
    });

    return this.findOne(planId, id);
  }

  async remove(planId: string, id: string) {
    const visit = await this.findOne(planId, id);

    if (visit.status !== 'PENDING' || visit.workOrder) {
      throw new BadRequestException(
        `Solo se pueden eliminar visitas en estado PENDING sin OT (estado actual: ${visit.status})`,
      );
    }

    await this.prisma.maintenanceVisit.delete({ where: { id } });

    return { id, deleted: true };
  }

  // ─── Equipos de la visita (4.2) ────────────────────────────────────────

  async markEquipmentNotAttended(
    planId: string,
    id: string,
    equipmentId: string,
    dto: MarkNotAttendedDto,
  ) {
    const item = await this.findOpenVisitItem(planId, id, equipmentId);

    if (item.status !== VisitEquipmentStatus.PENDING) {
      throw new BadRequestException(
        'Solo un equipo pendiente puede marcarse como no atendido.',
      );
    }

    await this.prisma.maintenanceVisitEquipment.update({
      where: { id: item.id },
      data: {
        status: VisitEquipmentStatus.NOT_ATTENDED,
        notAttendedReason: dto.reason,
        notAttendedNote: dto.note.trim(),
      },
    });

    return this.findOne(planId, id);
  }

  async revertEquipmentToPending(
    planId: string,
    id: string,
    equipmentId: string,
  ) {
    const item = await this.findOpenVisitItem(planId, id, equipmentId);

    if (item.status !== VisitEquipmentStatus.NOT_ATTENDED) {
      throw new BadRequestException(
        'Solo un equipo no atendido puede volver a pendiente. Para un equipo atendido, anula su intervención.',
      );
    }

    await this.prisma.maintenanceVisitEquipment.update({
      where: { id: item.id },
      data: {
        status: VisitEquipmentStatus.PENDING,
        notAttendedReason: null,
        notAttendedNote: null,
      },
    });

    return this.findOne(planId, id);
  }

  async setEarlyExecutionNote(
    planId: string,
    id: string,
    equipmentId: string,
    dto: EarlyExecutionNoteDto,
  ) {
    const item = await this.findOpenVisitItem(planId, id, equipmentId);

    if (item.status !== VisitEquipmentStatus.ATTENDED) {
      throw new BadRequestException(
        'La justificación de anticipación aplica solo a equipos atendidos.',
      );
    }

    await this.prisma.maintenanceVisitEquipment.update({
      where: { id: item.id },
      data: { earlyExecutionNote: dto.note.trim() },
    });

    return this.findOne(planId, id);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private withDeadline<
    T extends Parameters<typeof visitDeadline>[0] & { status: string },
  >(visit: T) {
    const open = visit.status === 'PENDING' || visit.status === 'IN_PROGRESS';
    return { ...visit, deadline: open ? visitDeadline(visit) : null };
  }

  private assertOpen(status: string) {
    if (status === 'CLOSED' || status === 'CANCELLED') {
      throw new BadRequestException(
        `La visita está ${status} y no se puede modificar.`,
      );
    }
  }

  private async findOpenVisitItem(
    planId: string,
    id: string,
    equipmentId: string,
  ) {
    const visit = await this.findOne(planId, id);
    this.assertOpen(visit.status);

    const item = await this.prisma.maintenanceVisitEquipment.findUnique({
      where: { visitId_equipmentId: { visitId: id, equipmentId } },
      select: VISIT_EQUIPMENT_SELECT,
    });

    if (!item) {
      throw new NotFoundException(
        `El equipo "${equipmentId}" no pertenece a esta visita`,
      );
    }

    return item;
  }

  private async ensurePlanExists(planId: string): Promise<void> {
    const plan = await this.prisma.maintenancePlan.findUnique({
      where: { id: planId },
      select: { id: true },
    });
    if (!plan) {
      throw new NotFoundException(
        `Plan de mantenimiento "${planId}" no encontrado`,
      );
    }
  }
}
