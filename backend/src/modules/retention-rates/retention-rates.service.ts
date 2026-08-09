import { Injectable } from '@nestjs/common';
import {
  Prisma,
  RetentionConcept,
  RetentionJurisdiction,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RETENTION_RATE_SELECT } from './retention-rates.constants';
import { QueryRetentionRatesDto } from './dto/query-retention-rates.dto';

// Contexto Retenciones (RETE FUENTE / RETE ICA): dominio de configuración
// independiente de Cotizaciones/Facturación/Finanzas. Ninguna tarifa vive en
// código — todo porcentaje debe existir como fila de RetentionRate con su
// fuente normativa. resolveRate() nunca asume 0%: si no hay fila vigente para
// el concepto/jurisdicción/fecha pedidos, devuelve null.

function vigentWhere(asOf: Date): Prisma.RetentionRateWhereInput {
  return {
    effectiveFrom: { lte: asOf },
    OR: [{ effectiveTo: null }, { effectiveTo: { gte: asOf } }],
  };
}

@Injectable()
export class RetentionRatesService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /retention-rates — alimenta la vista previa del frontend. Por defecto
  // (o con active=true) devuelve solo las vigentes hoy; active=false devuelve
  // el histórico completo. Sin CRUD: este módulo es de solo lectura.
  findAll(query: QueryRetentionRatesDto) {
    const showOnlyActive = query.active ?? true;
    const where = showOnlyActive ? vigentWhere(new Date()) : {};

    return this.prisma.retentionRate.findMany({
      where,
      select: RETENTION_RATE_SELECT,
      orderBy: [{ concept: 'asc' }, { jurisdiction: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  // Uso interno (no HTTP): resuelve la tarifa vigente para un concepto,
  // jurisdicción y fecha dados. taxpayerConditionNote NUNCA participa en esta
  // búsqueda — es únicamente trazabilidad documental, no un criterio de
  // resolución. Si la condición tributaria de STECH NODES cambia en el
  // futuro, se resuelve cerrando la fila vigente y creando una nueva; esta
  // consulta no necesita cambiar.
  async resolveRate(
    concept: RetentionConcept,
    jurisdiction: RetentionJurisdiction,
    asOf: Date,
  ) {
    return this.prisma.retentionRate.findFirst({
      where: { concept, jurisdiction, ...vigentWhere(asOf) },
      select: RETENTION_RATE_SELECT,
      orderBy: { effectiveFrom: 'desc' },
    });
  }
}
