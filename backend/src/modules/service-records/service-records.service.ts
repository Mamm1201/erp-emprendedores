import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
import { UpdateInterventionDto } from './dto/intervention.dto';

@Injectable()
export class ServiceRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByWorkOrder(workOrderId: string) {
    const workOrderExists = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, deletedAt: null },
      select: { id: true },
    });
    if (!workOrderExists) {
      throw new NotFoundException(`WorkOrder with id "${workOrderId}" not found`);
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
      throw new NotFoundException(`Equipment with id "${equipmentId}" not found`);
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
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, deletedAt: null },
      select: { id: true, type: true },
    });

    if (!workOrder) {
      throw new NotFoundException(`WorkOrder with id "${workOrderId}" not found`);
    }

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
          clientSignedAt: dto.clientSignedAt ? new Date(dto.clientSignedAt) : null,
        },
        select: { id: true },
      });

      for (const item of dto.interventions ?? []) {
        const checklistItems = await this.resolveChecklistItems(
          item.checklistItems,
          item.equipmentId,
        );

        const intervention = await tx.intervention.create({
          data: {
            workOrderId,
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
            occurredAt: new Date(),
          },
          select: { id: true },
        });

        if (checklistItems.length > 0) {
          await tx.checklistItem.createMany({
            data: checklistItems.map((ci) => ({
              ...ci,
              serviceRecordId: record.id,
              interventionId: intervention.id,
            })),
          });
        }
      }

      return record.id;
    });

    return this.findByWorkOrder(workOrderId);
  }

  async updateIntervention(
    workOrderId: string,
    interventionId: string,
    dto: UpdateInterventionDto,
  ) {
    const intervention = await this.prisma.intervention.findFirst({
      where: { id: interventionId, workOrderId },
      select: { id: true },
    });

    if (!intervention) {
      throw new NotFoundException(
        `Intervention "${interventionId}" not found for work order "${workOrderId}"`,
      );
    }

    return this.prisma.intervention.update({
      where: { id: interventionId },
      data: {
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
          clientSignedAt: dto.clientSignedAt ? new Date(dto.clientSignedAt) : null,
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
