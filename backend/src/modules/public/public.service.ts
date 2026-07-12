import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EquipmentStatus,
  EquipmentType,
  WorkOrderType,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EquipmentPublicDto, LastMaintenanceDto } from './dto/equipment-public.dto';

interface LastWorkOrderRow {
  completedAt: Date | null;
  type: WorkOrderType;
}

interface EquipmentPublicRow {
  qrCode: string | null;
  type: EquipmentType;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  installDate: Date | null;
  location: string | null;
  status: EquipmentStatus;
  warrantyExpiresAt: Date | null;
  branch: { name: string; city: string | null };
  workOrders: LastWorkOrderRow[];
}

const QR_CODE_PATTERN = /^[A-Za-z0-9_-]{12}$/;

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async findEquipmentByQrCode(qrCode: string): Promise<EquipmentPublicDto> {
    // SEC-I3: formato inválido responde igual que "no encontrado" — misma
    // excepción, mismo cuerpo de respuesta. El portal nunca revela si el
    // motivo fue formato incorrecto o inexistencia real del activo.
    if (!QR_CODE_PATTERN.test(qrCode)) {
      throw new NotFoundException('Equipment not found');
    }

    // deletedAt: null rejects soft-deleted records; DECOMMISSIONED (status field)
    // remains visible by design — it's an operational state, not a deletion.
    const equipment = await this.prisma.equipment.findUnique({
      where: { qrCode, deletedAt: null },
      select: {
        qrCode: true,
        type: true,
        brand: true,
        model: true,
        serialNumber: true,
        installDate: true,
        location: true,
        status: true,
        warrantyExpiresAt: true,
        branch: { select: { name: true, city: true } },
        // D-4.1: consulta directa sobre WorkOrder, sin traversar MaintenanceVisit.
        // Cubre PREVENTIVE (generadas desde plan) y CORRECTIVE (creadas directamente).
        // Fuente de fecha: completedAt — escrito de forma garantizada en la
        // transición IN_PROGRESS → COMPLETED. INSPECTION excluido explícitamente.
        workOrders: {
          where: {
            status: 'COMPLETED',
            type: { in: [WorkOrderType.PREVENTIVE, WorkOrderType.CORRECTIVE] },
            deletedAt: null,
          },
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: {
            completedAt: true,
            type: true,
          },
        },
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    return this.toPublicDto(equipment);
  }

  private toPublicDto(equipment: EquipmentPublicRow): EquipmentPublicDto {
    const lastWo = equipment.workOrders[0] ?? null;

    const lastMaintenance: LastMaintenanceDto | null =
      lastWo?.completedAt
        ? {
            date: lastWo.completedAt.toISOString().split('T')[0],
            type: lastWo.type as 'PREVENTIVE' | 'CORRECTIVE',
          }
        : null;

    return {
      qrCode: equipment.qrCode as string,
      type: equipment.type,
      brand: equipment.brand,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
      installDate: equipment.installDate
        ? equipment.installDate.toISOString().split('T')[0]
        : null,
      location: equipment.location,
      status: equipment.status,
      warrantyExpiresAt: equipment.warrantyExpiresAt
        ? equipment.warrantyExpiresAt.toISOString().split('T')[0]
        : null,
      branch: {
        name: equipment.branch.name,
        city: equipment.branch.city,
      },
      lastMaintenance,
    };
  }
}
