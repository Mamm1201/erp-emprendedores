import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PERSON_DEFAULT_LIMIT,
  PERSON_DEFAULT_PAGE,
  PERSON_SELECT,
} from './persons.constants';
import { CreatePersonDto } from './dto/create-person.dto';
import { QueryPersonsDto } from './dto/query-persons.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PersonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPersonsDto) {
    const page = query.page ?? PERSON_DEFAULT_PAGE;
    const limit = query.limit ?? PERSON_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.person.findMany({
        where,
        select: PERSON_SELECT,
        orderBy: { fullName: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.person.count({ where }),
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
    const person = await this.prisma.person.findFirst({
      where: { id, deletedAt: null },
      select: PERSON_SELECT,
    });

    if (!person) {
      throw new NotFoundException(`Person with id "${id}" not found`);
    }

    return person;
  }

  async create(dto: CreatePersonDto) {
    return this.prisma.person.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        profile: dto.profile,
        relationshipType: dto.relationshipType,
        notes: dto.notes,
      },
      select: PERSON_SELECT,
    });
  }

  async update(id: string, dto: UpdatePersonDto) {
    await this.ensureExists(id);

    return this.prisma.person.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.profile !== undefined && { profile: dto.profile }),
        ...(dto.relationshipType !== undefined && {
          relationshipType: dto.relationshipType,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      select: PERSON_SELECT,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.person.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }

  private buildWhere(query: QueryPersonsDto): Prisma.PersonWhereInput {
    const where: Prisma.PersonWhereInput = { deletedAt: null };

    if (query.profile) where.profile = query.profile;
    if (query.relationshipType) where.relationshipType = query.relationshipType;

    if (query.search?.trim()) {
      where.fullName = { contains: query.search.trim(), mode: 'insensitive' };
    }

    return where;
  }

  private async ensureExists(id: string): Promise<void> {
    const person = await this.prisma.person.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!person) {
      throw new NotFoundException(`Person with id "${id}" not found`);
    }
  }
}
