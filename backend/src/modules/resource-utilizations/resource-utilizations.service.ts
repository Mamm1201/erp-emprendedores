import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkOrderStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResourceUtilizationDto } from './dto/create-resource-utilization.dto';
import { UpdateResourceUtilizationDto } from './dto/update-resource-utilization.dto';

/**
 * Invariante del agregado WorkOrder: los hechos técnicos solo se modifican
 * mientras la OT está abierta (durante la ejecución). Una OT COMPLETED o
 * CANCELLED es inmutable — congela atómicamente todas sus utilizaciones.
 */
const EDITABLE_STATUSES: WorkOrderStatus[] = [
  WorkOrderStatus.DRAFT,
  WorkOrderStatus.SCHEDULED,
  WorkOrderStatus.IN_PROGRESS,
];

const UTILIZATION_SELECT = {
  id: true,
  resourceName: true,
  category: true,
  quantity: true,
  unit: true,
  origin: true,
  observation: true,
  createdAt: true,
  createdBy: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ResourceUtilizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByWorkOrder(workOrderId: string) {
    await this.getWorkOrderOrThrow(workOrderId);
    return this.prisma.resourceUtilization.findMany({
      where: { workOrderId },
      orderBy: { createdAt: 'asc' },
      select: UTILIZATION_SELECT,
    });
  }

  async create(
    workOrderId: string,
    dto: CreateResourceUtilizationDto,
    userId: string,
  ) {
    await this.assertEditableWorkOrder(workOrderId);
    return this.prisma.resourceUtilization.create({
      data: {
        workOrderId,
        resourceName: dto.resourceName,
        category: dto.category,
        quantity: dto.quantity,
        unit: dto.unit,
        origin: dto.origin,
        observation: dto.observation ?? null,
        createdById: userId,
      },
      select: UTILIZATION_SELECT,
    });
  }

  async update(
    workOrderId: string,
    id: string,
    dto: UpdateResourceUtilizationDto,
  ) {
    await this.assertEditableWorkOrder(workOrderId);
    await this.assertUtilizationBelongsToWorkOrder(id, workOrderId);
    return this.prisma.resourceUtilization.update({
      where: { id },
      data: {
        ...(dto.resourceName !== undefined && {
          resourceName: dto.resourceName,
        }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.origin !== undefined && { origin: dto.origin }),
        ...(dto.observation !== undefined && {
          observation: dto.observation || null,
        }),
      },
      select: UTILIZATION_SELECT,
    });
  }

  async remove(workOrderId: string, id: string) {
    await this.assertEditableWorkOrder(workOrderId);
    await this.assertUtilizationBelongsToWorkOrder(id, workOrderId);
    await this.prisma.resourceUtilization.delete({ where: { id } });
    return { id };
  }

  private async getWorkOrderOrThrow(workOrderId: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!workOrder) {
      throw new NotFoundException(`WorkOrder "${workOrderId}" not found`);
    }
    return workOrder;
  }

  /** Invariante: los hechos técnicos solo se modifican con la OT abierta. */
  private async assertEditableWorkOrder(workOrderId: string) {
    const workOrder = await this.getWorkOrderOrThrow(workOrderId);
    if (!EDITABLE_STATUSES.includes(workOrder.status)) {
      throw new BadRequestException(
        `No se pueden modificar los recursos de una OT en estado ${workOrder.status}: es inmutable tras el cierre.`,
      );
    }
    return workOrder;
  }

  /** Invariante: una utilización pertenece a una única OT. */
  private async assertUtilizationBelongsToWorkOrder(
    id: string,
    workOrderId: string,
  ) {
    const utilization = await this.prisma.resourceUtilization.findUnique({
      where: { id },
      select: { workOrderId: true },
    });
    if (!utilization || utilization.workOrderId !== workOrderId) {
      throw new NotFoundException(
        `Utilización "${id}" no encontrada en la OT "${workOrderId}"`,
      );
    }
  }
}
