import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ACCOUNT_DEFAULT_LIMIT,
  ACCOUNT_DEFAULT_PAGE,
  ACCOUNT_SELECT,
} from './accounts.constants';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { QueryAccountsDto } from './dto/query-accounts.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAccountsDto) {
    const page = query.page ?? ACCOUNT_DEFAULT_PAGE;
    const limit = query.limit ?? ACCOUNT_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        select: ACCOUNT_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.account.count({ where }),
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
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: ACCOUNT_SELECT,
    });

    if (!account) {
      throw new NotFoundException(`Account with id "${id}" not found`);
    }

    return account;
  }

  async create(dto: CreateAccountDto, ownerId: string) {
    return this.prisma.account.create({
      data: {
        legalName: dto.legalName,
        nit: dto.nit,
        city: dto.city,
        institutionType: dto.institutionType,
        sizePotential: dto.sizePotential,
        website: dto.website,
        status: dto.status,
        source: dto.source,
        notes: dto.notes,
        ownerId,
      },
      select: ACCOUNT_SELECT,
    });
  }

  async update(id: string, dto: UpdateAccountDto) {
    await this.findOne(id);

    return this.prisma.account.update({
      where: { id },
      data: {
        ...(dto.legalName !== undefined && { legalName: dto.legalName }),
        ...(dto.nit !== undefined && { nit: dto.nit }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.institutionType !== undefined && {
          institutionType: dto.institutionType,
        }),
        ...(dto.sizePotential !== undefined && {
          sizePotential: dto.sizePotential,
        }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: ACCOUNT_SELECT,
    });
  }

  private buildListWhere(query: QueryAccountsDto): Prisma.AccountWhereInput {
    const where: Prisma.AccountWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      where.legalName = { contains: query.search.trim(), mode: 'insensitive' };
    }

    return where;
  }
}
