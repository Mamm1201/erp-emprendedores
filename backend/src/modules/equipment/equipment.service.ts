import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { generateOpaqueToken } from '../../common/utils';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EQUIPMENT_DEFAULT_LIMIT,
  EQUIPMENT_DEFAULT_PAGE,
  EQUIPMENT_SELECT,
} from './equipment.constants';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { QueryEquipmentDto } from './dto/query-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(clientId: string, branchId: string, query: QueryEquipmentDto) {
    await this.ensureActiveBranch(clientId, branchId);

    const page = query.page ?? EQUIPMENT_DEFAULT_PAGE;
    const limit = query.limit ?? EQUIPMENT_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildActiveWhere(branchId, query);

    const [data, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        select: EQUIPMENT_SELECT,
        orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.equipment.count({ where }),
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

  async findOne(clientId: string, branchId: string, id: string) {
    await this.ensureActiveBranch(clientId, branchId);

    const equipment = await this.prisma.equipment.findFirst({
      where: { id, branchId, deletedAt: null },
      select: EQUIPMENT_SELECT,
    });

    if (!equipment) {
      throw new NotFoundException(
        `Equipment with id "${id}" not found for this branch`,
      );
    }

    return equipment;
  }

  async create(clientId: string, branchId: string, dto: CreateEquipmentDto) {
    await this.ensureActiveBranch(clientId, branchId);

    return this.prisma.equipment.create({
      data: {
        branchId,
        type: dto.type,
        criticality: dto.criticality ?? undefined,
        status: dto.status ?? undefined,
        warrantyExpiresAt: dto.warrantyExpiresAt
          ? new Date(dto.warrantyExpiresAt)
          : null,
        brand: dto.brand ?? null,
        model: dto.model ?? null,
        serialNumber: dto.serialNumber ?? null,
        installDate: dto.installDate ? new Date(dto.installDate) : null,
        location: dto.location ?? null,
        notes: dto.notes ?? null,
        qrCode: generateOpaqueToken(),
      },
      select: EQUIPMENT_SELECT,
    });
  }

  async assignQrCode(clientId: string, branchId: string, id: string) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id, branchId, deletedAt: null },
      select: { id: true, qrCode: true },
    });

    if (!equipment) {
      throw new NotFoundException(
        `Equipment with id "${id}" not found for this branch`,
      );
    }

    if (equipment.qrCode !== null) {
      throw new ConflictException(
        'Equipment already has a QR code assigned. Regeneration is not permitted in Phase 1.',
      );
    }

    return this.prisma.equipment.update({
      where: { id },
      data: { qrCode: generateOpaqueToken() },
      select: EQUIPMENT_SELECT,
    });
  }

  async update(
    clientId: string,
    branchId: string,
    id: string,
    dto: UpdateEquipmentDto,
  ) {
    await this.ensureEquipmentBelongsToBranch(clientId, branchId, id);

    if (Object.keys(dto).length === 0) {
      return this.findOne(clientId, branchId, id);
    }

    return this.prisma.equipment.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.criticality !== undefined && { criticality: dto.criticality }),
        ...(dto.warrantyExpiresAt !== undefined && {
          warrantyExpiresAt: dto.warrantyExpiresAt
            ? new Date(dto.warrantyExpiresAt)
            : null,
        }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
        ...(dto.installDate !== undefined && {
          installDate: dto.installDate ? new Date(dto.installDate) : null,
        }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      select: EQUIPMENT_SELECT,
    });
  }

  async remove(clientId: string, branchId: string, id: string) {
    await this.ensureEquipmentBelongsToBranch(clientId, branchId, id);

    return this.prisma.equipment.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, branchId: true, deletedAt: true },
    });
  }

  private buildActiveWhere(
    branchId: string,
    query: QueryEquipmentDto,
  ): Prisma.EquipmentWhereInput {
    const where: Prisma.EquipmentWhereInput = { branchId, deletedAt: null };

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { brand: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
        { serialNumber: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async ensureActiveBranch(
    clientId: string,
    branchId: string,
  ): Promise<void> {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, clientId, deletedAt: null },
      select: { id: true },
    });

    if (!branch) {
      throw new NotFoundException(
        `Branch with id "${branchId}" not found for this client`,
      );
    }
  }

  private async ensureEquipmentBelongsToBranch(
    clientId: string,
    branchId: string,
    equipmentId: string,
  ): Promise<void> {
    await this.ensureActiveBranch(clientId, branchId);

    const equipment = await this.prisma.equipment.findFirst({
      where: { id: equipmentId, branchId, deletedAt: null },
      select: { id: true },
    });

    if (!equipment) {
      throw new NotFoundException(
        `Equipment with id "${equipmentId}" not found for this branch`,
      );
    }
  }
}
