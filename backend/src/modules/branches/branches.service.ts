import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BRANCH_DEFAULT_LIMIT,
  BRANCH_DEFAULT_PAGE,
  BRANCH_SELECT,
} from './branches.constants';
import { CreateBranchDto } from './dto/create-branch.dto';
import { QueryBranchesDto } from './dto/query-branches.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(clientId: string, query: QueryBranchesDto) {
    await this.ensureActiveClient(clientId);

    const page = query.page ?? BRANCH_DEFAULT_PAGE;
    const limit = query.limit ?? BRANCH_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where = this.buildActiveWhere(clientId, query.search);

    const [data, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        select: BRANCH_SELECT,
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.branch.count({ where }),
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

  async findOne(clientId: string, id: string) {
    await this.ensureActiveClient(clientId);

    const branch = await this.prisma.branch.findFirst({
      where: { id, clientId, deletedAt: null },
      select: BRANCH_SELECT,
    });

    if (!branch) {
      throw new NotFoundException(
        `Branch with id "${id}" not found for this client`,
      );
    }

    return branch;
  }

  async create(clientId: string, dto: CreateBranchDto) {
    await this.ensureActiveClient(clientId);

    const isPrimary = dto.isPrimary ?? false;

    return this.prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await this.clearPrimaryForClient(tx, clientId);
      }

      return tx.branch.create({
        data: {
          clientId,
          name: dto.name,
          contactName: dto.contactName,
          contactPhone: dto.contactPhone,
          email: dto.email,
          address: dto.address,
          city: dto.city,
          department: dto.department,
          notes: dto.notes,
          isPrimary,
        },
        select: BRANCH_SELECT,
      });
    });
  }

  async update(clientId: string, id: string, dto: UpdateBranchDto) {
    await this.ensureBranchBelongsToClient(clientId, id);

    if (Object.keys(dto).length === 0) {
      return this.findOne(clientId, id);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary === true) {
        await this.clearPrimaryForClient(tx, clientId, id);
      }

      if (dto.isPrimary === false) {
        const othersPrimary = await tx.branch.count({
          where: {
            clientId,
            deletedAt: null,
            isPrimary: true,
            id: { not: id },
          },
        });

        if (othersPrimary === 0) {
          throw new BadRequestException(
            'Cannot unset primary branch: assign another branch as primary first',
          );
        }
      }

      return tx.branch.update({
        where: { id },
        data: dto,
        select: BRANCH_SELECT,
      });
    });
  }

  async remove(clientId: string, id: string) {
    const branch = await this.ensureBranchBelongsToClient(clientId, id);

    if (branch.isPrimary) {
      const otherBranches = await this.prisma.branch.count({
        where: { clientId, deletedAt: null, id: { not: id } },
      });

      if (otherBranches > 0) {
        throw new BadRequestException(
          'Cannot delete the primary branch while other active branches exist. Assign another branch as primary first.',
        );
      }
    }

    return this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date(), isPrimary: false },
      select: { id: true, clientId: true, deletedAt: true },
    });
  }

  private buildActiveWhere(
    clientId: string,
    search?: string,
  ): Prisma.BranchWhereInput {
    const where: Prisma.BranchWhereInput = {
      clientId,
      deletedAt: null,
    };

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
        { department: { contains: term, mode: 'insensitive' } },
        { address: { contains: term, mode: 'insensitive' } },
        { contactName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
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
      throw new NotFoundException(`Client with id "${clientId}" not found`);
    }
  }

  private async ensureBranchBelongsToClient(
    clientId: string,
    branchId: string,
  ) {
    await this.ensureActiveClient(clientId);

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, clientId, deletedAt: null },
      select: { id: true, isPrimary: true },
    });

    if (!branch) {
      throw new NotFoundException(
        `Branch with id "${branchId}" not found for this client`,
      );
    }

    return branch;
  }

  private async clearPrimaryForClient(
    tx: Prisma.TransactionClient,
    clientId: string,
    excludeBranchId?: string,
  ): Promise<void> {
    await tx.branch.updateMany({
      where: {
        clientId,
        deletedAt: null,
        ...(excludeBranchId ? { id: { not: excludeBranchId } } : {}),
      },
      data: { isPrimary: false },
    });
  }
}
