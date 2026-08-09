import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CLIENT_DEFAULT_LIMIT,
  CLIENT_DEFAULT_PAGE,
  CLIENT_SELECT,
} from './clients.constants';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryClientsDto) {
    const page = query.page ?? CLIENT_DEFAULT_PAGE;
    const limit = query.limit ?? CLIENT_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where = this.buildActiveWhere(query.search);

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        select: CLIENT_SELECT,
        orderBy: { legalName: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.client.count({ where }),
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
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      select: CLIENT_SELECT,
    });

    if (!client) {
      throw new NotFoundException(`Client with id "${id}" not found`);
    }

    return client;
  }

  create(dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        legalName: dto.legalName,
        tradeName: dto.tradeName,
        taxId: dto.taxId,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
        type: dto.type,
        isIncomeTaxRetentionAgent: dto.isIncomeTaxRetentionAgent,
        isIcaRetentionAgent: dto.isIcaRetentionAgent,
      },
      select: CLIENT_SELECT,
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureExists(id);

    if (Object.keys(dto).length === 0) {
      return this.findOne(id);
    }

    return this.prisma.client.update({
      where: { id },
      data: dto,
      select: CLIENT_SELECT,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        deletedAt: true,
      },
    });
  }

  private buildActiveWhere(search?: string): Prisma.ClientWhereInput {
    const where: Prisma.ClientWhereInput = { deletedAt: null };

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { legalName: { contains: term, mode: 'insensitive' } },
        { tradeName: { contains: term, mode: 'insensitive' } },
        { taxId: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async ensureExists(id: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException(`Client with id "${id}" not found`);
    }
  }
}
