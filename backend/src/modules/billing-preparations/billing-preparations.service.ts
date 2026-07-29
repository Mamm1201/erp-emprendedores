import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BillingResolution, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  calculateLineTotals,
  sumMoney,
  toMoney,
} from '../../common/utils/money.util';
import { OpenBillingPreparationDto } from './dto/open-billing-preparation.dto';
import { SetLineResolutionDto } from './dto/set-line-resolution.dto';

interface LineRow {
  id: string;
  resolution: BillingResolution;
  source: string;
  billableQuantity: Prisma.Decimal | null;
  unitPrice: Prisma.Decimal | null;
  discountAmount: Prisma.Decimal;
  taxRate: Prisma.Decimal;
}

@Injectable()
export class BillingPreparationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Invariante 1: una preparación corresponde a una única OT CERRADA. */
  async open(dto: OpenBillingPreparationDto, userId: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: dto.workOrderId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!workOrder) {
      throw new NotFoundException(`WorkOrder "${dto.workOrderId}" not found`);
    }
    if (workOrder.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Solo se prepara facturación de una OT cerrada (COMPLETED).',
      );
    }
    const existing = await this.prisma.billingPreparation.findUnique({
      where: { workOrderId: dto.workOrderId },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        'Ya existe una preparación de facturación para esta OT.',
      );
    }
    const created = await this.prisma.billingPreparation.create({
      data: { workOrderId: dto.workOrderId, createdById: userId },
      select: { id: true },
    });
    return this.compose(created.id);
  }

  async findByWorkOrder(workOrderId: string) {
    const prep = await this.prisma.billingPreparation.findUnique({
      where: { workOrderId },
      select: { id: true },
    });
    if (!prep) {
      throw new NotFoundException(
        `No hay preparación de facturación para la OT "${workOrderId}"`,
      );
    }
    return this.compose(prep.id);
  }

  async findOne(id: string) {
    return this.compose(id);
  }

  /** Fija/actualiza la resolución de un elemento (upsert por utilización). Solo en DRAFT. */
  async setResolution(preparationId: string, dto: SetLineResolutionDto) {
    const prep = await this.assertDraft(preparationId);

    // Invariante: el elemento resuelto pertenece a la OT de esta preparación.
    const utilization = await this.prisma.resourceUtilization.findUnique({
      where: { id: dto.utilizationId },
      select: { id: true, workOrderId: true, quantity: true },
    });
    if (!utilization || utilization.workOrderId !== prep.workOrderId) {
      throw new NotFoundException(
        'La utilización no pertenece a la OT de esta preparación.',
      );
    }

    let data: Prisma.BillingLineResolutionUncheckedCreateInput;
    if (dto.resolution === 'CHARGE') {
      if (dto.unitPrice === undefined || dto.unitPrice === null) {
        throw new BadRequestException(
          'El precio (unitPrice) es obligatorio cuando el elemento se cobra.',
        );
      }
      data = {
        billingPreparationId: preparationId,
        utilizationId: dto.utilizationId,
        resolution: 'CHARGE',
        source: 'DISCRETIONARY',
        billableQuantity: dto.billableQuantity ?? Number(utilization.quantity),
        unitPrice: dto.unitPrice,
        discountAmount: dto.discountAmount ?? 0,
        taxRate: dto.taxRate ?? 0,
      };
    } else {
      // ABSORB: no lleva valores económicos.
      data = {
        billingPreparationId: preparationId,
        utilizationId: dto.utilizationId,
        resolution: 'ABSORB',
        source: 'DISCRETIONARY',
        billableQuantity: null,
        unitPrice: null,
        discountAmount: 0,
        taxRate: 0,
      };
    }

    await this.prisma.billingLineResolution.upsert({
      where: {
        billingPreparationId_utilizationId: {
          billingPreparationId: preparationId,
          utilizationId: dto.utilizationId,
        },
      },
      create: data,
      update: {
        resolution: data.resolution,
        source: data.source,
        billableQuantity: data.billableQuantity ?? null,
        unitPrice: data.unitPrice ?? null,
        discountAmount: data.discountAmount ?? 0,
        taxRate: data.taxRate ?? 0,
      },
    });

    return this.compose(preparationId);
  }

  /** Quita la resolución de un elemento (vuelve a "pendiente"). Solo en DRAFT. */
  async removeResolution(preparationId: string, utilizationId: string) {
    await this.assertDraft(preparationId);
    await this.prisma.billingLineResolution.deleteMany({
      where: { billingPreparationId: preparationId, utilizationId },
    });
    return this.compose(preparationId);
  }

  /**
   * Confirma la preparación.
   * Invariante 2 (completitud): cada elemento ejecutado debe tener resolución.
   * Invariante 6 (inmutabilidad): tras confirmar, no admite cambios.
   */
  async confirm(preparationId: string, userId: string) {
    const prep = await this.assertDraft(preparationId);

    const [utilCount, resCount] = await Promise.all([
      this.prisma.resourceUtilization.count({
        where: { workOrderId: prep.workOrderId },
      }),
      this.prisma.billingLineResolution.count({
        where: { billingPreparationId: preparationId },
      }),
    ]);
    if (resCount < utilCount) {
      throw new BadRequestException(
        'Faltan elementos por resolver: cada recurso utilizado debe estar cobrado o absorbido antes de confirmar.',
      );
    }

    await this.prisma.billingPreparation.update({
      where: { id: preparationId },
      data: {
        status: 'CONFIRMED',
        confirmedById: userId,
        confirmedAt: new Date(),
      },
    });
    return this.compose(preparationId);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async assertDraft(id: string) {
    const prep = await this.prisma.billingPreparation.findUnique({
      where: { id },
      select: { id: true, status: true, workOrderId: true },
    });
    if (!prep) {
      throw new NotFoundException(`Preparación "${id}" no encontrada`);
    }
    if (prep.status !== 'DRAFT') {
      throw new BadRequestException(
        'La preparación ya está confirmada: es inmutable.',
      );
    }
    return prep;
  }

  private lineTotal(row: LineRow): Prisma.Decimal {
    if (row.resolution !== 'CHARGE') return toMoney(0);
    return calculateLineTotals({
      quantity: toMoney(row.billableQuantity ?? 0),
      unitPrice: toMoney(row.unitPrice ?? 0),
      discountAmount: toMoney(row.discountAmount ?? 0),
      taxRate: toMoney(row.taxRate ?? 0),
    }).lineTotal;
  }

  /** Compone la vista: elementos (utilización + su resolución) + resultado DERIVADO. */
  private async compose(id: string) {
    const prep = await this.prisma.billingPreparation.findUnique({
      where: { id },
      select: {
        id: true,
        workOrderId: true,
        status: true,
        notes: true,
        createdAt: true,
        confirmedAt: true,
        createdBy: { select: { id: true, name: true } },
        confirmedBy: { select: { id: true, name: true } },
        workOrder: { select: { number: true, status: true } },
        resolutions: {
          select: {
            id: true,
            utilizationId: true,
            resolution: true,
            source: true,
            billableQuantity: true,
            unitPrice: true,
            discountAmount: true,
            taxRate: true,
          },
        },
      },
    });
    if (!prep) {
      throw new NotFoundException(`Preparación "${id}" no encontrada`);
    }

    const utils = await this.prisma.resourceUtilization.findMany({
      where: { workOrderId: prep.workOrderId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        resourceName: true,
        category: true,
        quantity: true,
        unit: true,
        origin: true,
        observation: true,
      },
    });

    const byUtil = new Map(prep.resolutions.map((r) => [r.utilizationId, r]));

    const elements = utils.map((u) => {
      const r = byUtil.get(u.id);
      return {
        utilization: u,
        resolution: r
          ? {
              id: r.id,
              resolution: r.resolution,
              source: r.source,
              billableQuantity: r.billableQuantity,
              unitPrice: r.unitPrice,
              discountAmount: r.discountAmount,
              taxRate: r.taxRate,
              lineTotal: this.lineTotal(r).toFixed(2),
            }
          : null,
      };
    });

    const chargeLines = prep.resolutions.filter(
      (r) => r.resolution === 'CHARGE',
    );
    const total = sumMoney(chargeLines.map((r) => this.lineTotal(r)));

    return {
      id: prep.id,
      workOrderId: prep.workOrderId,
      workOrderNumber: prep.workOrder.number,
      status: prep.status,
      notes: prep.notes,
      createdAt: prep.createdAt,
      confirmedAt: prep.confirmedAt,
      createdBy: prep.createdBy,
      confirmedBy: prep.confirmedBy,
      elements,
      // Resultado DERIVADO (no persistido).
      result: {
        chargedCount: chargeLines.length,
        absorbedCount: prep.resolutions.length - chargeLines.length,
        pendingCount: utils.length - prep.resolutions.length,
        total: total.toFixed(2),
      },
    };
  }
}
