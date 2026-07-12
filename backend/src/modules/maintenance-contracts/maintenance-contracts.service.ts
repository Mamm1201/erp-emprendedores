import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CONTRACT_DEFAULT_LIMIT,
  CONTRACT_DEFAULT_PAGE,
  CONTRACT_DOCUMENT_TYPE,
  CONTRACT_NUMBER_PREFIX,
  CONTRACT_SELECT,
} from './maintenance-contracts.constants';
import { CreateMaintenanceContractDto } from './dto/create-maintenance-contract.dto';
import { UpdateMaintenanceContractDto } from './dto/update-maintenance-contract.dto';
import { QueryMaintenanceContractsDto } from './dto/query-maintenance-contracts.dto';
import { AttachContractEquipmentDto } from './dto/attach-contract-equipment.dto';
import { nextDocumentNumber } from '../quotations/quotations-document.service';

const CONTRACT_EQUIPMENT_SELECT = {
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
} satisfies Prisma.ContractEquipmentSelect;

@Injectable()
export class MaintenanceContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryMaintenanceContractsDto) {
    const page = query.page ?? CONTRACT_DEFAULT_PAGE;
    const limit = query.limit ?? CONTRACT_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.maintenanceContract.findMany({
        where,
        select: CONTRACT_SELECT,
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.maintenanceContract.count({ where }),
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
    const contract = await this.prisma.maintenanceContract.findFirst({
      where: { id, deletedAt: null },
      select: CONTRACT_SELECT,
    });

    if (!contract) {
      throw new NotFoundException(`Contrato con id "${id}" no encontrado`);
    }

    return contract;
  }

  async create(dto: CreateMaintenanceContractDto) {
    await this.ensureActiveClient(dto.clientId);

    if (dto.quotationId) {
      await this.ensureQuotationAvailable(dto.quotationId);
    }

    if (dto.signedById) {
      await this.ensureUserExists(dto.signedById);
    }

    return this.prisma.$transaction(async (tx) => {
      const number = await nextDocumentNumber(
        tx,
        CONTRACT_DOCUMENT_TYPE,
        CONTRACT_NUMBER_PREFIX,
      );

      if (dto.quotationId) {
        await tx.quotation.update({
          where: { id: dto.quotationId },
          data: { status: 'CONVERTED' },
        });
      }

      return tx.maintenanceContract.create({
        data: {
          number,
          clientId: dto.clientId,
          billingCycle: dto.billingCycle,
          value: dto.value,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          quotationId: dto.quotationId ?? null,
          signedById: dto.signedById ?? null,
          signedAt: dto.signedAt ? new Date(dto.signedAt) : null,
          correctiveIncluded: dto.correctiveIncluded ?? false,
          partsIncluded: dto.partsIncluded ?? false,
          transportIncluded: dto.transportIncluded ?? false,
          serviceHours: dto.serviceHours ?? undefined,
          slaHoursCritical: dto.slaHoursCritical ?? null,
          slaHoursHigh: dto.slaHoursHigh ?? null,
          slaHoursMedium: dto.slaHoursMedium ?? null,
          slaHoursLow: dto.slaHoursLow ?? null,
          notes: dto.notes ?? null,
        },
        select: CONTRACT_SELECT,
      });
    });
  }

  async update(id: string, dto: UpdateMaintenanceContractDto) {
    await this.findOne(id);

    if (dto.signedById) {
      await this.ensureUserExists(dto.signedById);
    }

    if (Object.keys(dto).length === 0) {
      return this.findOne(id);
    }

    return this.prisma.maintenanceContract.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.billingCycle !== undefined && { billingCycle: dto.billingCycle }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.signedById !== undefined && { signedById: dto.signedById }),
        ...(dto.signedAt !== undefined && {
          signedAt: dto.signedAt ? new Date(dto.signedAt) : null,
        }),
        ...(dto.correctiveIncluded !== undefined && {
          correctiveIncluded: dto.correctiveIncluded,
        }),
        ...(dto.partsIncluded !== undefined && { partsIncluded: dto.partsIncluded }),
        ...(dto.transportIncluded !== undefined && {
          transportIncluded: dto.transportIncluded,
        }),
        ...(dto.serviceHours !== undefined && { serviceHours: dto.serviceHours }),
        ...(dto.slaHoursCritical !== undefined && {
          slaHoursCritical: dto.slaHoursCritical,
        }),
        ...(dto.slaHoursHigh !== undefined && { slaHoursHigh: dto.slaHoursHigh }),
        ...(dto.slaHoursMedium !== undefined && {
          slaHoursMedium: dto.slaHoursMedium,
        }),
        ...(dto.slaHoursLow !== undefined && { slaHoursLow: dto.slaHoursLow }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: CONTRACT_SELECT,
    });
  }

  async remove(id: string) {
    const contract = await this.prisma.maintenanceContract.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!contract) {
      throw new NotFoundException(`Contrato con id "${id}" no encontrado`);
    }

    if (contract.status === 'ACTIVE') {
      throw new BadRequestException(
        'No se puede eliminar un contrato en estado ACTIVE. Cambia el estado primero.',
      );
    }

    return this.prisma.maintenanceContract.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, number: true, deletedAt: true },
    });
  }

  async findEquipment(contractId: string) {
    await this.findOne(contractId);

    return this.prisma.contractEquipment.findMany({
      where: { contractId },
      select: CONTRACT_EQUIPMENT_SELECT,
      orderBy: { addedAt: 'asc' },
    });
  }

  async attachEquipment(contractId: string, dto: AttachContractEquipmentDto) {
    const contract = await this.findOne(contractId);

    await this.resolveEquipmentForClient(dto.equipmentId, contract.client.id);

    return this.prisma.contractEquipment.create({
      data: { contractId, equipmentId: dto.equipmentId },
      select: CONTRACT_EQUIPMENT_SELECT,
    });
  }

  async detachEquipment(contractId: string, equipmentId: string) {
    await this.findOne(contractId);

    const link = await this.prisma.contractEquipment.findUnique({
      where: { contractId_equipmentId: { contractId, equipmentId } },
      select: { id: true },
    });

    if (!link) {
      throw new NotFoundException(
        `Equipo "${equipmentId}" no está asociado a este contrato`,
      );
    }

    await this.prisma.contractEquipment.delete({ where: { id: link.id } });

    return { contractId, equipmentId, removed: true };
  }

  private async resolveEquipmentForClient(equipmentId: string, clientId: string) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id: equipmentId, deletedAt: null, branch: { clientId } },
      select: { id: true },
    });

    if (!equipment) {
      throw new BadRequestException(
        `Equipment "${equipmentId}" not found for this client`,
      );
    }

    return equipment;
  }

  private buildWhere(
    query: QueryMaintenanceContractsDto,
  ): Prisma.MaintenanceContractWhereInput {
    const where: Prisma.MaintenanceContractWhereInput = { deletedAt: null };

    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { number: { contains: term, mode: 'insensitive' } },
        { client: { legalName: { contains: term, mode: 'insensitive' } } },
        { client: { tradeName: { contains: term, mode: 'insensitive' } } },
        { notes: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async ensureActiveClient(clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, deletedAt: null },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException(`Cliente con id "${clientId}" no encontrado`);
    }
  }

  private async ensureQuotationAvailable(quotationId: string): Promise<void> {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id: quotationId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!quotation) {
      throw new NotFoundException(
        `Cotización con id "${quotationId}" no encontrada`,
      );
    }
    if (quotation.status !== 'APPROVED') {
      throw new BadRequestException(
        `Solo se pueden vincular cotizaciones en estado APPROVED (estado actual: ${quotation.status})`,
      );
    }
    const existing = await this.prisma.maintenanceContract.findFirst({
      where: { quotationId, deletedAt: null },
      select: { id: true, number: true },
    });
    if (existing) {
      throw new BadRequestException(
        `La cotización ya está vinculada al contrato ${existing.number}`,
      );
    }
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(`Usuario con id "${userId}" no encontrado`);
    }
  }
}
