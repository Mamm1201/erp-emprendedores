import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CONTACT_DEFAULT_LIMIT,
  CONTACT_DEFAULT_PAGE,
  CONTACT_SELECT,
} from './contacts.constants';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(accountId: string, query: QueryContactsDto) {
    await this.ensureAccount(accountId);

    const page = query.page ?? CONTACT_DEFAULT_PAGE;
    const limit = query.limit ?? CONTACT_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(accountId, query.search);

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        select: CONTACT_SELECT,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.contact.count({ where }),
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

  async findOne(accountId: string, id: string) {
    await this.ensureAccount(accountId);
    return this.ensureContactBelongsToAccount(accountId, id);
  }

  async create(accountId: string, dto: CreateContactDto) {
    await this.ensureAccount(accountId);

    if (dto.branchId) {
      await this.ensureBranchExists(dto.branchId);
    }

    return this.prisma.contact.create({
      data: {
        accountId,
        branchId: dto.branchId,
        name: dto.name,
        role: dto.role,
        area: dto.area,
        linkedinUrl: dto.linkedinUrl,
        email: dto.email,
        phone: dto.phone,
        influenceLevel: dto.influenceLevel,
        notes: dto.notes,
      },
      select: CONTACT_SELECT,
    });
  }

  async update(accountId: string, id: string, dto: UpdateContactDto) {
    await this.ensureContactBelongsToAccount(accountId, id);

    if (dto.branchId) {
      await this.ensureBranchExists(dto.branchId);
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        ...(dto.branchId !== undefined && { branchId: dto.branchId }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.area !== undefined && { area: dto.area }),
        ...(dto.linkedinUrl !== undefined && { linkedinUrl: dto.linkedinUrl }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.influenceLevel !== undefined && {
          influenceLevel: dto.influenceLevel,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: CONTACT_SELECT,
    });
  }

  private buildWhere(accountId: string, search?: string): Prisma.ContactWhereInput {
    const where: Prisma.ContactWhereInput = { accountId };

    if (search?.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    return where;
  }

  private async ensureAccount(accountId: string): Promise<void> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException(`Account with id "${accountId}" not found`);
    }
  }

  // Solo confirma que el Branch exista — NO valida que pertenezca a la
  // institucion de esta Account: esa relacion no esta resuelta en esta
  // fase (Account aun no esta vinculada a ningun Client hasta la
  // promocion, ver Contrato de Diseño Fase 0).
  private async ensureBranchExists(branchId: string): Promise<void> {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, deletedAt: null },
      select: { id: true },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with id "${branchId}" not found`);
    }
  }

  // La query esta scopeada por accountId Y id a la vez — un Contact de
  // otra Account nunca se encuentra, nunca se expone si "pertenece" o no.
  private async ensureContactBelongsToAccount(accountId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, accountId },
      select: CONTACT_SELECT,
    });

    if (!contact) {
      throw new NotFoundException(
        `Contact with id "${id}" not found for this account`,
      );
    }

    return contact;
  }
}
