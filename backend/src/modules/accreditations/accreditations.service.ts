import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccreditationStatus } from '../../generated/prisma/client';
import { generateOpaqueToken } from '../../common/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { ACCREDITATION_SELECT } from './accreditations.constants';
import { IssueAccreditationDto } from './dto/issue-accreditation.dto';
import { ReissueAccreditationDto } from './dto/reissue-accreditation.dto';
import { RevokeAccreditationDto } from './dto/revoke-accreditation.dto';

@Injectable()
export class AccreditationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPerson(personId: string) {
    await this.ensurePersonExists(personId);

    return this.prisma.accreditation.findMany({
      where: { personId },
      select: ACCREDITATION_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Lock de la fila de Person (SELECT ... FOR UPDATE) para serializar
  // intentos concurrentes de issue/reissue sobre la misma persona — unica
  // forma de garantizar "una sola Accreditation ACTIVE por Person" sin
  // constraint de base de datos. Mismo patron que Opportunity en F1.8
  // (ver opportunities.service.ts, generateQuotation).
  async issue(personId: string, dto: IssueAccreditationDto, issuedById: string) {
    this.assertValidWindow(dto.validFrom, dto.validUntil);

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM persons WHERE id = ${personId} AND "deletedAt" IS NULL
        FOR UPDATE
      `;

      if (locked.length === 0) {
        throw new NotFoundException(`Person with id "${personId}" not found`);
      }

      const existingActive = await tx.accreditation.findFirst({
        where: { personId, status: AccreditationStatus.ACTIVE },
        select: { id: true },
      });

      if (existingActive) {
        throw new ConflictException(
          'Person already has an active accreditation. Use reissue to revoke and replace it.',
        );
      }

      return tx.accreditation.create({
        data: {
          personId,
          qrCode: generateOpaqueToken(),
          displayRole: dto.displayRole,
          status: AccreditationStatus.ACTIVE,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          issuedById,
        },
        select: ACCREDITATION_SELECT,
      });
    });
  }

  async revoke(personId: string, accreditationId: string, dto: RevokeAccreditationDto) {
    const accreditation = await this.ensureActiveAccreditation(personId, accreditationId);

    return this.prisma.accreditation.update({
      where: { id: accreditation.id },
      data: {
        status: AccreditationStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: dto.revokedReason ?? null,
      },
      select: ACCREDITATION_SELECT,
    });
  }

  async reissue(personId: string, dto: ReissueAccreditationDto, issuedById: string) {
    this.assertValidWindow(dto.validFrom, dto.validUntil);

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM persons WHERE id = ${personId} AND "deletedAt" IS NULL
        FOR UPDATE
      `;

      if (locked.length === 0) {
        throw new NotFoundException(`Person with id "${personId}" not found`);
      }

      const current = await tx.accreditation.findFirst({
        where: { personId, status: AccreditationStatus.ACTIVE },
        select: { id: true },
      });

      if (!current) {
        throw new NotFoundException(
          'Person has no active accreditation to reissue. Use issue to create the first one.',
        );
      }

      await tx.accreditation.update({
        where: { id: current.id },
        data: {
          status: AccreditationStatus.REVOKED,
          revokedAt: new Date(),
          revokedReason: dto.previousRevokedReason ?? null,
        },
      });

      return tx.accreditation.create({
        data: {
          personId,
          qrCode: generateOpaqueToken(),
          displayRole: dto.displayRole,
          status: AccreditationStatus.ACTIVE,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          issuedById,
        },
        select: ACCREDITATION_SELECT,
      });
    });
  }

  private assertValidWindow(validFrom?: string, validUntil?: string): void {
    if (validFrom && validUntil && new Date(validUntil) < new Date(validFrom)) {
      throw new BadRequestException('validUntil must be on or after validFrom');
    }
  }

  private async ensurePersonExists(personId: string): Promise<void> {
    const person = await this.prisma.person.findFirst({
      where: { id: personId, deletedAt: null },
      select: { id: true },
    });

    if (!person) {
      throw new NotFoundException(`Person with id "${personId}" not found`);
    }
  }

  private async ensureActiveAccreditation(personId: string, accreditationId: string) {
    const accreditation = await this.prisma.accreditation.findFirst({
      where: { id: accreditationId, personId, status: AccreditationStatus.ACTIVE },
      select: { id: true },
    });

    if (!accreditation) {
      throw new NotFoundException(
        `Active accreditation with id "${accreditationId}" not found for this person`,
      );
    }

    return accreditation;
  }
}
