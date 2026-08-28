import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CHECKLIST_ITEM_SELECT,
  DEFAULT_CHECKLIST,
  SERVICE_RECORD_SELECT,
} from './service-records.constants';
import { CreateServiceRecordDto } from './dto/create-service-record.dto';
import { UpdateServiceRecordDto } from './dto/update-service-record.dto';
import { UpdateChecklistItemDto } from './dto/checklist-item.dto';

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

    return record;
  }

  async findByEquipment(equipmentId: string) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id: equipmentId, deletedAt: null },
      select: { id: true },
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with id "${equipmentId}" not found`);
    }

    const data = await this.prisma.serviceRecord.findMany({
      where: { workOrder: { equipmentId } },
      select: {
        ...SERVICE_RECORD_SELECT,
        checklistItems: {
          select: CHECKLIST_ITEM_SELECT,
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data };
  }

  async create(workOrderId: string, dto: CreateServiceRecordDto) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, deletedAt: null },
      select: { id: true, equipmentId: true, type: true },
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

    // dto.equipmentId (lo que el usuario elige en el selector "Equipo
    // intervenido") tiene prioridad sobre workOrder.equipmentId para elegir
    // el checklist por defecto — antes se ignoraba por completo.
    const checklistItems = await this.resolveChecklistItems(
      dto.checklistItems,
      dto.equipmentId ?? workOrder.equipmentId ?? undefined,
    );

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.serviceRecord.create({
        data: {
          workOrderId,
          findings: dto.findings ?? null,
          activitiesPerformed: dto.activitiesPerformed ?? null,
          recommendations: dto.recommendations ?? null,
          clientSignedAt: dto.clientSignedAt ? new Date(dto.clientSignedAt) : null,
          checklistItems: {
            create: checklistItems,
          },
        },
        select: {
          ...SERVICE_RECORD_SELECT,
          checklistItems: {
            select: CHECKLIST_ITEM_SELECT,
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // Fix del selector "Equipo intervenido": si se eligio un equipo, crea
      // la Intervention correspondiente — la fuente de verdad de
      // trazabilidad por activo (Intervention.equipmentId es obligatorio a
      // nivel de schema). Sin equipo elegido, no se crea nada — mantiene
      // compatibilidad exacta con el comportamiento historico (OTs sin
      // equipo identificado, hoy y en el futuro).
      if (dto.equipmentId) {
        const intervention = await tx.intervention.create({
          data: {
            workOrderId,
            equipmentId: dto.equipmentId,
            type: workOrder.type,
            // Nace COMPLETED: este formulario ya provee hallazgos/
            // actividades/checklist en un solo paso, igual que ServiceRecord
            // ya se crea "completo" hoy. Necesario para que la regla de
            // integridad "COMPLETED requiere Intervention en estado
            // terminal" no bloquee el cierre de la OT sin un mecanismo de
            // gestion de Intervention (fuera de alcance de este paso).
            status: 'COMPLETED',
            findings: dto.findings ?? null,
            activitiesPerformed: dto.activitiesPerformed ?? null,
            recommendations: dto.recommendations ?? null,
            occurredAt: new Date(),
          },
        });

        // Un solo set de ChecklistItem, vinculado a ambos padres — no se
        // duplica: serviceRecordId (sin cambios) + interventionId (nuevo).
        await tx.checklistItem.updateMany({
          where: { id: { in: record.checklistItems.map((i) => i.id) } },
          data: { interventionId: intervention.id },
        });
      }

      return record;
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
