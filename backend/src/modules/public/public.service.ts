import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AccreditationStatus,
  EquipmentStatus,
  EquipmentType,
  WorkOrderType,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccreditationPublicDto } from './dto/accreditation-public.dto';
import {
  EquipmentPublicDto,
  LastMaintenanceDto,
  RelationshipStatus,
} from './dto/equipment-public.dto';

// Relacion comercial vigente = contrato de mantenimiento vigente para el
// equipo, o al menos una Intervention completada dentro de esta ventana.
// Especificacion cerrada 2026-08-29 — ver project_qr_closure_and_production_readiness.
const RELATIONSHIP_GRACE_MONTHS = 12;

interface LastInterventionRow {
  occurredAt: Date | null;
  type: WorkOrderType;
}

interface EquipmentPublicRow {
  id: string;
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
  interventions: LastInterventionRow[];
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
        id: true,
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
        // Trazabilidad por activo (Intervention, no WorkOrder): un equipo
        // puede intervenirse dentro de una OT de sede/multi-equipo donde
        // WorkOrder.equipmentId queda null — Intervention.equipmentId es la
        // fuente correcta. Fuente de fecha: occurredAt.
        interventions: {
          where: {
            status: 'COMPLETED',
            type: { in: [WorkOrderType.PREVENTIVE, WorkOrderType.CORRECTIVE] },
          },
          orderBy: { occurredAt: 'desc' },
          take: 1,
          select: {
            occurredAt: true,
            type: true,
          },
        },
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    const lastIv = equipment.interventions[0] ?? null;

    // Cuando la última intervención fue correctiva, se busca además la
    // última preventiva del mismo equipo: mostrar solo la correctiva podría
    // sugerir que el activo no tiene plan preventivo vigente cuando sí lo
    // tiene. En los demás casos (preventiva ya es la última, o no hay
    // ninguna) no hace falta esta segunda consulta.
    const lastPreventiveIv: LastInterventionRow | null =
      lastIv?.type === WorkOrderType.CORRECTIVE
        ? await this.prisma.intervention.findFirst({
            where: {
              equipmentId: equipment.id,
              status: 'COMPLETED',
              type: WorkOrderType.PREVENTIVE,
            },
            orderBy: { occurredAt: 'desc' },
            select: { occurredAt: true, type: true },
          })
        : null;

    const relationshipStatus = await this.resolveRelationshipStatus(equipment.id, lastIv);

    return this.toPublicDto(equipment, lastPreventiveIv, relationshipStatus);
  }

  async findAccreditationByQrCode(qrCode: string): Promise<AccreditationPublicDto> {
    // Mismo patron anti-enumeracion que Equipment (SEC-I3): formato invalido
    // responde igual que "no encontrado".
    if (!QR_CODE_PATTERN.test(qrCode)) {
      throw new NotFoundException('Accreditation not found');
    }

    const accreditation = await this.prisma.accreditation.findUnique({
      where: { qrCode },
      select: {
        status: true,
        displayRole: true,
        validFrom: true,
        validUntil: true,
        person: { select: { fullName: true, deletedAt: true } },
      },
    });

    // Decision 4 (Fase 3.1): una Person con deletedAt != null responde
    // exactamente igual que un QR inexistente — mismo error, mismo cuerpo.
    // Nunca se distingue publicamente "no existe" de "persona eliminada".
    if (!accreditation || accreditation.person.deletedAt !== null) {
      throw new NotFoundException('Accreditation not found');
    }

    const now = new Date();
    const withinWindow =
      (accreditation.validFrom === null || accreditation.validFrom <= now) &&
      (accreditation.validUntil === null || accreditation.validUntil >= now);
    const valid = accreditation.status === AccreditationStatus.ACTIVE && withinWindow;

    return {
      personName: accreditation.person.fullName,
      displayRole: accreditation.displayRole,
      status: valid ? 'VALID' : 'NOT_VALID',
    };
  }

  // Relacion comercial vigente (especificacion cerrada 2026-08-29):
  // contrato de mantenimiento ACTIVE vigente hoy para el equipo, o al menos
  // una Intervention completada dentro de los ultimos RELATIONSHIP_GRACE_MONTHS.
  private async resolveRelationshipStatus(
    equipmentId: string,
    lastIntervention: LastInterventionRow | null,
  ): Promise<RelationshipStatus> {
    const now = new Date();

    if (lastIntervention?.occurredAt) {
      const graceLimit = new Date(lastIntervention.occurredAt);
      graceLimit.setMonth(graceLimit.getMonth() + RELATIONSHIP_GRACE_MONTHS);
      if (graceLimit >= now) return 'CURRENT';
    }

    const activeContract = await this.prisma.contractEquipment.findFirst({
      where: {
        equipmentId,
        contract: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now },
          deletedAt: null,
        },
      },
      select: { id: true },
    });

    return activeContract ? 'CURRENT' : 'LAPSED';
  }

  private toMaintenanceDto(iv: LastInterventionRow | null): LastMaintenanceDto | null {
    return iv?.occurredAt
      ? {
          date: iv.occurredAt.toISOString().split('T')[0],
          type: iv.type as 'PREVENTIVE' | 'CORRECTIVE',
        }
      : null;
  }

  private toPublicDto(
    equipment: EquipmentPublicRow,
    lastPreventiveIv: LastInterventionRow | null,
    relationshipStatus: RelationshipStatus,
  ): EquipmentPublicDto {
    // LAPSED: nunca se expone informacion tecnica, aunque exista historial
    // real internamente (el historial no se borra, solo deja de publicarse).
    const lastMaintenance =
      relationshipStatus === 'CURRENT' ? this.toMaintenanceDto(equipment.interventions[0] ?? null) : null;
    const lastPreventiveMaintenance =
      relationshipStatus === 'CURRENT' ? this.toMaintenanceDto(lastPreventiveIv) : null;

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
      relationshipStatus,
      lastMaintenance,
      lastPreventiveMaintenance,
    };
  }
}
