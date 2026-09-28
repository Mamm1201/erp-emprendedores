import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InterventionStatus,
  Prisma,
  WorkOrderStatus,
  WorkOrderType,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  businessMidnight,
  linkInterventionToVisit,
  unlinkInterventionFromVisit,
} from '../maintenance-visits/maintenance-visits.domain';
import {
  CHECKLIST_ITEM_SELECT,
  DEFAULT_CHECKLIST,
  INTERVENTION_SELECT,
  INTERVENTION_WITH_WORK_ORDER_SELECT,
  SERVICE_RECORD_SELECT,
} from './service-records.constants';
import { CreateServiceRecordDto } from './dto/create-service-record.dto';
import { UpdateServiceRecordDto } from './dto/update-service-record.dto';
import { UpdateChecklistItemDto } from './dto/checklist-item.dto';
import {
  AddInterventionsDto,
  InterventionInputDto,
  UpdateInterventionDto,
} from './dto/intervention.dto';

const CLOSED_WORK_ORDER_STATUSES = new Set<WorkOrderStatus>([
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.CANCELLED,
]);

@Injectable()
export class ServiceRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByWorkOrder(workOrderId: string) {
    const workOrderExists = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, deletedAt: null },
      select: { id: true },
    });
    if (!workOrderExists) {
      throw new NotFoundException(
        `WorkOrder with id "${workOrderId}" not found`,
      );
    }

    const record = await this.prisma.serviceRecord.findUnique({
      where: { workOrderId },
      select: {
        ...SERVICE_RECORD_SELECT,
        checklistItems: {
          select: CHECKLIST_ITEM_SELECT,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(
        `No service record found for work order "${workOrderId}"`,
      );
    }

    const interventions = await this.prisma.intervention.findMany({
      where: { workOrderId },
      select: INTERVENTION_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    return { ...record, interventions };
  }

  async findByEquipment(equipmentId: string) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id: equipmentId, deletedAt: null },
      select: { id: true },
    });

    if (!equipment) {
      throw new NotFoundException(
        `Equipment with id "${equipmentId}" not found`,
      );
    }

    // Trazabilidad por activo: lee directamente Intervention.equipmentId,
    // no WorkOrder.equipmentId (ese campo queda null en la mayoria de OT
    // de sede/multi-equipo — ver auditoria 2026-08-28).
    const data = await this.prisma.intervention.findMany({
      where: { equipmentId },
      select: INTERVENTION_WITH_WORK_ORDER_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return { data };
  }

  async create(workOrderId: string, dto: CreateServiceRecordDto) {
    // Un acta sin intervenciones (solo documental) no exige OT abierta.
    const workOrder = await this.findOpenWorkOrder(workOrderId, {
      requireOpen: (dto.interventions?.length ?? 0) > 0,
    });

    const existing = await this.prisma.serviceRecord.findUnique({
      where: { workOrderId },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `A service record already exists for work order "${workOrderId}"`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // ServiceRecord es la entidad documental del Acta (identidad del
      // documento/PDF, fecha de firma) — el contenido tecnico nuevo vive
      // en Intervention, una por cada equipo realmente intervenido.
      const record = await tx.serviceRecord.create({
        data: {
          workOrderId,
          clientSignedAt: dto.clientSignedAt
            ? new Date(dto.clientSignedAt)
            : null,
        },
        select: { id: true },
      });

      await this.createInterventions(
        tx,
        workOrder,
        record.id,
        dto.interventions ?? [],
      );

      return record.id;
    });

    return this.findByWorkOrder(workOrderId);
  }

  // R14: la OT/acta sigue recibiendo intervenciones mientras este abierta
  // (una visita puede ejecutarse en varias jornadas).
  async addInterventions(workOrderId: string, dto: AddInterventionsDto) {
    const workOrder = await this.findOpenWorkOrder(workOrderId);

    const record = await this.prisma.serviceRecord.findUnique({
      where: { workOrderId },
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundException(
        `No service record found for work order "${workOrderId}". Crea el acta primero.`,
      );
    }

    await this.prisma.$transaction((tx) =>
      this.createInterventions(tx, workOrder, record.id, dto.interventions),
    );

    return this.findByWorkOrder(workOrderId);
  }

  // Anular nunca borra: la intervencion queda CANCELLED (fuera del QR / Hoja
  // de Vida) y su equipo en la visita vuelve a pendiente.
  async cancelIntervention(workOrderId: string, interventionId: string) {
    await this.findOpenWorkOrder(workOrderId);

    const intervention = await this.prisma.intervention.findFirst({
      where: { id: interventionId, workOrderId },
      select: { id: true, status: true },
    });

    if (!intervention) {
      throw new NotFoundException(
        `Intervention "${interventionId}" not found for work order "${workOrderId}"`,
      );
    }

    if (intervention.status === InterventionStatus.CANCELLED) {
      throw new BadRequestException('La intervención ya está anulada.');
    }

    return this.prisma.$transaction(async (tx) => {
      await unlinkInterventionFromVisit(tx, interventionId);
      return tx.intervention.update({
        where: { id: interventionId },
        data: { status: InterventionStatus.CANCELLED },
        select: INTERVENTION_SELECT,
      });
    });
  }

  async updateIntervention(
    workOrderId: string,
    interventionId: string,
    dto: UpdateInterventionDto,
  ) {
    const intervention = await this.prisma.intervention.findFirst({
      where: { id: interventionId, workOrderId },
      select: { id: true, workOrder: { select: { status: true } } },
    });

    if (!intervention) {
      throw new NotFoundException(
        `Intervention "${interventionId}" not found for work order "${workOrderId}"`,
      );
    }

    // La fecha real queda congelada al cerrar la OT.
    let occurredAt: Date | undefined;
    if (dto.occurredAt !== undefined) {
      if (CLOSED_WORK_ORDER_STATUSES.has(intervention.workOrder.status)) {
        throw new BadRequestException(
          'La fecha real de la intervención no se puede cambiar: la OT ya está cerrada.',
        );
      }
      occurredAt = this.parseOccurredAt(dto.occurredAt);
    }

    return this.prisma.intervention.update({
      where: { id: interventionId },
      data: {
        ...(occurredAt !== undefined && { occurredAt }),
        ...(dto.findings !== undefined && { findings: dto.findings }),
        ...(dto.activitiesPerformed !== undefined && {
          activitiesPerformed: dto.activitiesPerformed,
        }),
        ...(dto.recommendations !== undefined && {
          recommendations: dto.recommendations,
        }),
        ...(dto.primaryTechnicianId !== undefined && {
          primaryTechnicianId: dto.primaryTechnicianId,
        }),
      },
      select: INTERVENTION_SELECT,
    });
  }

  async update(workOrderId: string, dto: UpdateServiceRecordDto) {
    await this.findByWorkOrder(workOrderId);

    const record = await this.prisma.serviceRecord.findUnique({
      where: { workOrderId },
      select: { id: true },
    });

    return this.prisma.serviceRecord.update({
      where: { id: record!.id },
      data: {
        ...(dto.findings !== undefined && { findings: dto.findings }),
        ...(dto.activitiesPerformed !== undefined && {
          activitiesPerformed: dto.activitiesPerformed,
        }),
        ...(dto.recommendations !== undefined && {
          recommendations: dto.recommendations,
        }),
        ...(dto.clientSignedAt !== undefined && {
          clientSignedAt: dto.clientSignedAt
            ? new Date(dto.clientSignedAt)
            : null,
        }),
      },
      select: {
        ...SERVICE_RECORD_SELECT,
        checklistItems: {
          select: CHECKLIST_ITEM_SELECT,
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateChecklistItem(
    workOrderId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
  ) {
    const record = await this.prisma.serviceRecord.findUnique({
      where: { workOrderId },
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundException(
        `No service record found for work order "${workOrderId}"`,
      );
    }

    const item = await this.prisma.checklistItem.findFirst({
      where: { id: itemId, serviceRecordId: record.id },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException(`Checklist item "${itemId}" not found`);
    }

    return this.prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.result !== undefined && { result: dto.result }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: CHECKLIST_ITEM_SELECT,
    });
  }

  private async createInterventions(
    tx: Prisma.TransactionClient,
    workOrder: {
      id: string;
      type: WorkOrderType;
      clientId: string;
      branchId: string | null;
    },
    serviceRecordId: string,
    items: InterventionInputDto[],
  ) {
    for (const item of items) {
      await this.assertEquipmentOfWorkOrder(item.equipmentId, workOrder);
      const occurredAt = item.occurredAt
        ? this.parseOccurredAt(item.occurredAt)
        : new Date();

      const checklistItems = await this.resolveChecklistItems(
        item.checklistItems,
        item.equipmentId,
      );

      const intervention = await tx.intervention.create({
        data: {
          workOrderId: workOrder.id,
          equipmentId: item.equipmentId,
          type: workOrder.type,
          // Nace COMPLETED: este formulario ya provee hallazgos/
          // actividades/checklist en un solo paso. Necesario para que la
          // regla de integridad "COMPLETED requiere Intervention en
          // estado terminal" no bloquee el cierre de la OT sin un
          // mecanismo de gestion de Intervention (fuera de alcance).
          status: 'COMPLETED',
          findings: item.findings ?? null,
          activitiesPerformed: item.activitiesPerformed ?? null,
          recommendations: item.recommendations ?? null,
          primaryTechnicianId: item.primaryTechnicianId ?? null,
          occurredAt,
        },
        select: { id: true },
      });

      if (checklistItems.length > 0) {
        await tx.checklistItem.createMany({
          data: checklistItems.map((ci) => ({
            ...ci,
            serviceRecordId,
            interventionId: intervention.id,
          })),
        });
      }

      await linkInterventionToVisit(tx, {
        workOrderId: workOrder.id,
        interventionId: intervention.id,
        equipmentId: item.equipmentId,
        occurredAt,
        earlyExecutionNote: item.earlyExecutionNote,
      });
    }
  }

  // R14: solo se registran/anulan intervenciones con la OT abierta.
  private async findOpenWorkOrder(
    workOrderId: string,
    { requireOpen = true } = {},
  ) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, deletedAt: null },
      select: {
        id: true,
        type: true,
        status: true,
        clientId: true,
        branchId: true,
      },
    });

    if (!workOrder) {
      throw new NotFoundException(
        `WorkOrder with id "${workOrderId}" not found`,
      );
    }

    if (requireOpen && CLOSED_WORK_ORDER_STATUSES.has(workOrder.status)) {
      throw new BadRequestException(
        `La OT está ${workOrder.status}: no admite registrar ni anular intervenciones.`,
      );
    }

    return workOrder;
  }

  // R13: el equipo debe ser de la sede de la OT (o del cliente si la OT no
  // tiene sede, p. ej. correctivos sin sede definida).
  private async assertEquipmentOfWorkOrder(
    equipmentId: string,
    workOrder: { clientId: string; branchId: string | null },
  ) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id: equipmentId, deletedAt: null },
      select: { branchId: true, branch: { select: { clientId: true } } },
    });

    if (!equipment) {
      throw new BadRequestException(`Equipment "${equipmentId}" not found`);
    }

    const belongs = workOrder.branchId
      ? equipment.branchId === workOrder.branchId
      : equipment.branch.clientId === workOrder.clientId;

    if (!belongs) {
      throw new BadRequestException(
        workOrder.branchId
          ? 'El equipo no pertenece a la sede de la OT.'
          : 'El equipo no pertenece al cliente de la OT.',
      );
    }
  }

  private parseOccurredAt(value: string): Date {
    const occurredAt =
      value.length === 10 ? businessMidnight(value) : new Date(value);
    if (occurredAt.getTime() > Date.now()) {
      throw new BadRequestException(
        'La fecha real de la intervención no puede ser futura.',
      );
    }
    return occurredAt;
  }

  private async resolveChecklistItems(
    provided?: { description: string; result?: string; notes?: string }[],
    equipmentId?: string,
  ) {
    if (provided && provided.length > 0) {
      return provided.map((item) => ({
        description: item.description,
        result: (item.result as any) ?? 'NA',
        notes: item.notes ?? null,
      }));
    }

    if (equipmentId) {
      const equipment = await this.prisma.equipment.findFirst({
        where: { id: equipmentId, deletedAt: null },
        select: { type: true },
      });

      if (equipment) {
        const defaults = DEFAULT_CHECKLIST[equipment.type] ?? [];
        return defaults.map((description) => ({
          description,
          result: 'NA' as const,
          notes: null,
        }));
      }
    }

    return [];
  }
}
