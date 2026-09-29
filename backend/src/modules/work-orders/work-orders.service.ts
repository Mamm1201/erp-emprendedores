import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  WorkOrderStatus,
  WorkOrderType,
  InterventionStatus,
} from '../../generated/prisma/client';
import {
  calculateLineTotals,
  sumMoney,
  toMoney,
} from '../../common/utils/money.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WORK_ORDER_DEFAULT_LIMIT,
  WORK_ORDER_DEFAULT_PAGE,
  WORK_ORDER_DOCUMENT_TYPE,
  WORK_ORDER_ITEM_SELECT,
  WORK_ORDER_NUMBER_PREFIX,
  WORK_ORDER_SELECT,
} from './work-orders.constants';
import { nextDocumentNumber } from '../quotations/quotations-document.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { QueryWorkOrdersDto } from './dto/query-work-orders.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { UpdateWorkOrderTechniciansDto } from './dto/update-work-order-technicians.dto';
import { WorkOrderItemDto } from './dto/work-order-item.dto';
import {
  RECONCILE_VISIT_SELECT,
  reconcileForClose,
} from '../maintenance-visits/maintenance-visits.domain';

const ALLOWED_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.DRAFT]: [
    WorkOrderStatus.SCHEDULED,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.SCHEDULED]: [
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.IN_PROGRESS]: [
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.COMPLETED]: [],
  [WorkOrderStatus.CANCELLED]: [],
};

const EDITABLE_STATUSES = new Set<WorkOrderStatus>([
  WorkOrderStatus.DRAFT,
  WorkOrderStatus.SCHEDULED,
]);

@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryWorkOrdersDto) {
    const page = query.page ?? WORK_ORDER_DEFAULT_PAGE;
    const limit = query.limit ?? WORK_ORDER_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        select: WORK_ORDER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.workOrder.count({ where }),
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

  async findOne(id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...WORK_ORDER_SELECT,
        items: {
          select: WORK_ORDER_ITEM_SELECT,
          orderBy: { lineOrder: 'asc' },
        },
        invoice: {
          select: {
            id: true,
            number: true,
            status: true,
            total: true,
            payments: { where: { voidedAt: null }, select: { amount: true } },
          },
        },
        serviceRecord: { select: { id: true } },
        technicians: {
          select: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`WorkOrder with id "${id}" not found`);
    }

    const technicians = workOrder.technicians.map((t) => t.user);

    if (workOrder.invoice) {
      const { payments, ...invoice } = workOrder.invoice;
      const paidTotal = sumMoney(payments.map((p) => toMoney(p.amount)));
      return { ...workOrder, technicians, invoice: { ...invoice, paidTotal } };
    }

    return { ...workOrder, technicians };
  }

  // Reemplaza el conjunto completo de ejecutores de la OT. La OT es la fuente
  // de verdad de la ejecución (distinta de assignedToId, el responsable
  // asignado en planeación); el Acta Técnica y su PDF solo leen esta relación.
  async setTechnicians(id: string, dto: UpdateWorkOrderTechniciansDto) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!workOrder) {
      throw new NotFoundException(`WorkOrder with id "${id}" not found`);
    }

    const technicianIds = [...new Set(dto.technicianIds)];
    if (technicianIds.length > 0) {
      const count = await this.prisma.user.count({
        where: { id: { in: technicianIds } },
      });
      if (count !== technicianIds.length) {
        throw new BadRequestException('One or more technicianIds are invalid');
      }
    }

    await this.prisma.$transaction([
      this.prisma.workOrderTechnician.deleteMany({
        where: { workOrderId: id },
      }),
      this.prisma.workOrderTechnician.createMany({
        data: technicianIds.map((userId) => ({ workOrderId: id, userId })),
      }),
    ]);

    return this.findOne(id);
  }

  async create(dto: CreateWorkOrderDto, userId: string) {
    await this.ensureActiveClient(dto.clientId);
    const type = dto.type ?? WorkOrderType.CORRECTIVE;

    // C1 (solo SUPPLY): sede indicada -> sede de la cotizacion -> sede
    // principal del cliente. Una OT de Suministro necesita una ubicacion valida
    // para registrar los equipos entregados. Los demas tipos usan solo la sede
    // indicada (o ninguna), como antes.
    const branchId = await this.resolveWorkOrderBranch(dto, type);
    await this.resolveBranch(dto.clientId, branchId);
    if (type === WorkOrderType.SUPPLY && !branchId) {
      throw new BadRequestException(
        'La OT de Suministro requiere una sede: el cliente no tiene sedes registradas.',
      );
    }
    if (dto.equipmentId) {
      await this.resolveEquipment(dto.equipmentId, branchId);
    }

    // Al convertir una cotización sin ítems explícitos, la OT hereda las líneas
    // de la cotización (visita, repuestos, etc.). Sin esto la OT nace vacía y la
    // Cuenta de Cobro no tendría qué facturar.
    const sourceItems =
      dto.quotationId && (!dto.items || dto.items.length === 0)
        ? await this.copyItemsFromQuotation(dto.quotationId)
        : (dto.items ?? []);

    const { items, totals } = this.buildItemsPayload(sourceItems);

    return this.prisma.$transaction(async (tx) => {
      const number = await nextDocumentNumber(
        tx,
        WORK_ORDER_DOCUMENT_TYPE,
        WORK_ORDER_NUMBER_PREFIX,
      );

      if (dto.quotationId) {
        await tx.quotation.update({
          where: { id: dto.quotationId },
          data: { status: 'CONVERTED' },
        });
      }

      return tx.workOrder.create({
        data: {
          number,
          clientId: dto.clientId,
          branchId,
          quotationId: dto.quotationId ?? null,
          type,
          status: WorkOrderStatus.DRAFT,
          title: dto.title,
          description: dto.description ?? null,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          equipmentId: dto.equipmentId ?? null,
          assignedToId: dto.assignedToId ?? null,
          createdById: userId,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
          items: items.length > 0 ? { create: items } : undefined,
        },
        select: {
          ...WORK_ORDER_SELECT,
          items: {
            select: WORK_ORDER_ITEM_SELECT,
            orderBy: { lineOrder: 'asc' },
          },
        },
      });
    });
  }

  async update(id: string, dto: UpdateWorkOrderDto, userId: string) {
    const workOrder = await this.findEditableWorkOrder(id);

    if (dto.branchId) {
      await this.resolveBranch(workOrder.clientId, dto.branchId);
    }

    // R13: la sede de la OT de una visita es la sede del plan.
    if (dto.branchId !== undefined && dto.branchId !== workOrder.branchId) {
      const visit = await this.prisma.maintenanceVisit.findUnique({
        where: { workOrderId: id },
        select: { id: true },
      });
      if (visit) {
        throw new BadRequestException(
          'La OT pertenece a una visita de mantenimiento: su sede es la del plan y no se puede cambiar.',
        );
      }
    }

    if (dto.equipmentId) {
      await this.resolveEquipment(dto.equipmentId, dto.branchId);
    }

    const itemsPayload = dto.items ? this.buildItemsPayload(dto.items) : null;

    return this.prisma.$transaction(async (tx) => {
      if (itemsPayload) {
        await tx.workOrderItem.deleteMany({ where: { workOrderId: id } });
      }

      return tx.workOrder.update({
        where: { id },
        data: {
          ...(dto.branchId !== undefined && { branchId: dto.branchId }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.scheduledAt !== undefined && {
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          }),
          ...(dto.assignedToId !== undefined && {
            assignedToId: dto.assignedToId,
          }),
          ...(dto.equipmentId !== undefined && {
            equipmentId: dto.equipmentId || null,
          }),
          updatedById: userId,
          ...(itemsPayload && {
            subtotal: itemsPayload.totals.subtotal,
            discountTotal: itemsPayload.totals.discountTotal,
            taxTotal: itemsPayload.totals.taxTotal,
            total: itemsPayload.totals.total,
            items: { create: itemsPayload.items },
          }),
        },
        select: {
          ...WORK_ORDER_SELECT,
          items: {
            select: WORK_ORDER_ITEM_SELECT,
            orderBy: { lineOrder: 'asc' },
          },
        },
      });
    });
  }

  async updateStatus(id: string, dto: UpdateWorkOrderStatusDto) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, clientId: true, branchId: true },
    });

    if (!workOrder) {
      throw new NotFoundException(`WorkOrder with id "${id}" not found`);
    }

    const allowed = ALLOWED_TRANSITIONS[workOrder.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition WorkOrder from ${workOrder.status} to ${dto.status}`,
      );
    }

    // Regla de integridad de trazabilidad: no puede existir una OT
    // COMPLETED sin al menos una Intervention, y ninguna puede quedar
    // IN_PROGRESS al momento de cerrar la OT — evita que una intervencion
    // tecnica quede huerfana o a medio documentar.
    if (dto.status === WorkOrderStatus.COMPLETED) {
      const interventions = await this.prisma.intervention.findMany({
        where: { workOrderId: id },
        select: { status: true },
      });

      if (interventions.length === 0) {
        throw new BadRequestException(
          'No se puede completar la OT: debe registrarse al menos una intervención técnica (Acta con equipo asociado).',
        );
      }

      const notTerminal = interventions.filter(
        (i) =>
          i.status !== InterventionStatus.COMPLETED &&
          i.status !== InterventionStatus.CANCELLED,
      );
      if (notTerminal.length > 0) {
        throw new BadRequestException(
          `No se puede completar la OT: ${notTerminal.length} intervención(es) siguen en estado IN_PROGRESS. Cierra o cancela cada intervención antes de completar la OT.`,
        );
      }
    }

    // OT de una visita de mantenimiento: el cierre concilia la visita (R11,
    // R7, R9) y la cancelacion la devuelve a PENDING solo si no hay
    // intervenciones completadas (R15).
    const visit = await this.prisma.maintenanceVisit.findUnique({
      where: { workOrderId: id },
      select: RECONCILE_VISIT_SELECT,
    });
    const visitCompliance =
      visit && dto.status === WorkOrderStatus.COMPLETED
        ? reconcileForClose(visit)
        : null;

    if (visit && dto.status === WorkOrderStatus.CANCELLED) {
      const completed = await this.prisma.intervention.count({
        where: { workOrderId: id, status: InterventionStatus.COMPLETED },
      });
      if (completed > 0) {
        throw new BadRequestException(
          `No se puede cancelar la OT de una visita con ${completed} intervención(es) completadas. Anúlalas primero o completa la OT.`,
        );
      }
    }

    const timestamps: Prisma.WorkOrderUpdateInput = {};
    if (dto.status === WorkOrderStatus.IN_PROGRESS) {
      timestamps.startedAt = new Date();
    }
    if (dto.status === WorkOrderStatus.COMPLETED) {
      timestamps.completedAt = new Date();
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id },
        data: { status: dto.status, ...timestamps },
        select: {
          ...WORK_ORDER_SELECT,
          items: {
            select: WORK_ORDER_ITEM_SELECT,
            orderBy: { lineOrder: 'asc' },
          },
          invoice: { select: { id: true, number: true, status: true } },
          serviceRecord: { select: { id: true } },
        },
      });

      if (visit && visitCompliance) {
        await tx.maintenanceVisit.update({
          where: { id: visit.id },
          data: {
            status: 'CLOSED',
            compliance: visitCompliance,
            closedAt: new Date(),
          },
        });
      }

      if (visit && dto.status === WorkOrderStatus.CANCELLED) {
        // H2: se libera workOrderId para poder generar otra OT.
        await tx.maintenanceVisit.update({
          where: { id: visit.id },
          data: { status: 'PENDING', workOrderId: null },
        });
      }

      return updated;
    });
  }

  async remove(id: string) {
    const workOrder = await this.findOne(id);

    if (workOrder.status !== WorkOrderStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT work orders can be deleted. Use status transition to CANCELLED.',
      );
    }

    // H1: la OT de una visita no se elimina (el borrado es logico y dejaria
    // la visita apuntando a una OT eliminada); solo se cancela.
    const visit = await this.prisma.maintenanceVisit.findUnique({
      where: { workOrderId: id },
      select: { id: true },
    });
    if (visit) {
      throw new BadRequestException(
        'La OT pertenece a una visita de mantenimiento: no se elimina, se cancela.',
      );
    }

    return this.prisma.workOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, number: true, deletedAt: true },
    });
  }

  private buildListWhere(
    query: QueryWorkOrdersDto,
  ): Prisma.WorkOrderWhereInput {
    const where: Prisma.WorkOrderWhereInput = { deletedAt: null };

    if (query.clientId) where.clientId = query.clientId;
    if (query.branchId) where.branchId = query.branchId;
    if (query.status) where.status = query.status;
    if (query.assignedToId) where.assignedToId = query.assignedToId;

    if (query.fromDate || query.toDate) {
      where.scheduledAt = {
        ...(query.fromDate && { gte: new Date(query.fromDate) }),
        ...(query.toDate && { lte: new Date(query.toDate) }),
      };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { number: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async copyItemsFromQuotation(
    quotationId: string,
  ): Promise<WorkOrderItemDto[]> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      select: {
        items: {
          orderBy: { lineOrder: 'asc' },
          select: {
            lineOrder: true,
            description: true,
            quantity: true,
            unitPrice: true,
            discountAmount: true,
            taxRate: true,
          },
        },
      },
    });

    return (quotation?.items ?? []).map((item) => ({
      lineOrder: item.lineOrder,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discountAmount: Number(item.discountAmount),
      taxRate: Number(item.taxRate),
    }));
  }

  private buildItemsPayload(items: WorkOrderItemDto[]) {
    const lineResults = items.map((item, index) => {
      const quantity = toMoney(item.quantity);
      const unitPrice = toMoney(item.unitPrice);
      const discountAmount = toMoney(item.discountAmount ?? 0);
      const taxRate = toMoney(item.taxRate ?? 0);

      const totals = calculateLineTotals({
        quantity,
        unitPrice,
        discountAmount,
        taxRate,
      });

      return {
        create: {
          lineOrder: item.lineOrder ?? index,
          description: item.description,
          quantity,
          unitPrice,
          discountAmount,
          taxRate,
          lineSubtotal: totals.lineSubtotal,
          lineTotal: totals.lineTotal,
        },
        discountAmount,
        lineSubtotal: totals.lineSubtotal,
        lineTax: totals.lineTax,
      };
    });

    const subtotal = sumMoney(lineResults.map((l) => l.lineSubtotal));
    const discountTotal = sumMoney(lineResults.map((l) => l.discountAmount));
    const taxTotal = sumMoney(lineResults.map((l) => l.lineTax));
    const total = sumMoney(lineResults.map((l) => l.create.lineTotal));

    return {
      items: lineResults.map((l) => l.create),
      totals: { subtotal, discountTotal, taxTotal, total },
    };
  }

  private async ensureActiveClient(clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, deletedAt: null },
      select: { id: true, legalName: true },
    });

    if (!client) {
      throw new NotFoundException(`Client with id "${clientId}" not found`);
    }

    return client;
  }

  // Sede explicita; si no hay y la OT es SUPPLY (C1): sede de la cotizacion ->
  // sede principal del cliente (isPrimary, o la primera activa).
  private async resolveWorkOrderBranch(
    dto: CreateWorkOrderDto,
    type: WorkOrderType,
  ): Promise<string | null> {
    if (dto.branchId) return dto.branchId;
    if (type !== WorkOrderType.SUPPLY) return null;

    if (dto.quotationId) {
      const quotation = await this.prisma.quotation.findUnique({
        where: { id: dto.quotationId },
        select: { branchId: true },
      });
      if (quotation?.branchId) return quotation.branchId;
    }

    const primary = await this.prisma.branch.findFirst({
      where: { clientId: dto.clientId, deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    return primary?.id ?? null;
  }

  private async resolveBranch(clientId: string, branchId?: string | null) {
    if (!branchId) return null;

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, clientId, deletedAt: null },
      select: { id: true },
    });

    if (!branch) {
      throw new BadRequestException(
        `Branch "${branchId}" not found for this client`,
      );
    }

    return branch;
  }

  private async resolveEquipment(
    equipmentId: string,
    branchId?: string | null,
  ) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id: equipmentId, deletedAt: null },
      select: { id: true, branchId: true },
    });

    if (!equipment) {
      throw new BadRequestException(`Equipment "${equipmentId}" not found`);
    }

    if (branchId && equipment.branchId !== branchId) {
      throw new BadRequestException(
        `Equipment "${equipmentId}" does not belong to the selected branch`,
      );
    }

    return equipment;
  }

  private async findEditableWorkOrder(id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, clientId: true, branchId: true },
    });

    if (!workOrder) {
      throw new NotFoundException(`WorkOrder with id "${id}" not found`);
    }

    if (!EDITABLE_STATUSES.has(workOrder.status)) {
      throw new BadRequestException(
        `WorkOrder in status ${workOrder.status} cannot be edited`,
      );
    }

    return workOrder;
  }
}
