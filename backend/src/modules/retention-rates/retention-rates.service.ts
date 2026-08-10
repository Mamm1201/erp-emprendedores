import { Injectable } from '@nestjs/common';
import { Prisma, RetentionConcept } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RETENTION_RATE_SELECT } from './retention-rates.constants';
import { QueryRetentionRatesDto } from './dto/query-retention-rates.dto';

// Contexto Retenciones (RETE FUENTE / RETE ICA): dominio de configuración
// independiente de Cotizaciones/Facturación/Finanzas. Ninguna tarifa vive en
// código — todo porcentaje debe existir como fila de RetentionRate con su
// fuente normativa. resolveRate() nunca asume 0%: si no hay fila vigente para
// el concepto/municipio/fecha pedidos, devuelve null.

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
  // El DIVIPOLA (municipalityCode) es un detalle interno de resolución y
  // NUNCA se serializa hacia el frontend — se reemplaza aquí por `cityLabel`
  // (el texto tal como aparece en Branch.city), resuelto vía MunicipalityAlias.
  async findAll(query: QueryRetentionRatesDto) {
    const showOnlyActive = query.active ?? true;
    const where = showOnlyActive ? vigentWhere(new Date()) : {};

    const [rates, aliases] = await Promise.all([
      this.prisma.retentionRate.findMany({
        where,
        select: RETENTION_RATE_SELECT,
        orderBy: [
          { concept: 'asc' },
          { municipalityCode: 'asc' },
          { effectiveFrom: 'desc' },
        ],
      }),
      this.prisma.municipalityAlias.findMany({
        select: { cityLabel: true, divipolaCode: true },
      }),
    ]);

    const cityLabelByDivipola = new Map(
      aliases.map((alias) => [alias.divipolaCode, alias.cityLabel]),
    );

    return rates.map(({ municipalityCode, ...rate }) => ({
      ...rate,
      cityLabel: municipalityCode
        ? (cityLabelByDivipola.get(municipalityCode) ?? null)
        : null,
    }));
  }

  // Uso interno (no HTTP): resuelve la tarifa vigente para un concepto,
  // código DIVIPOLA (null si es nacional) y fecha dados. taxpayerConditionNote
  // NUNCA participa en esta búsqueda — es únicamente trazabilidad documental,
  // no un criterio de resolución. Si la condición tributaria de STECH NODES
  // cambia en el futuro, se resuelve cerrando la fila vigente y creando una
  // nueva; esta consulta no necesita cambiar.
  async resolveRate(
    concept: RetentionConcept,
    municipalityCode: string | null,
    asOf: Date,
  ) {
    return this.prisma.retentionRate.findFirst({
      where: { concept, municipalityCode, ...vigentWhere(asOf) },
      select: RETENTION_RATE_SELECT,
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  // Ciudad de Branch (texto libre) → código DIVIPOLA, vía MunicipalityAlias.
  // Uso exclusivamente interno (QuotationsService.buildRetentionLinesPayload)
  // — el DIVIPOLA nunca llega al frontend. Si la ciudad no tiene alias
  // configurado todavía, devuelve null (sin jurisdicción determinable); nunca
  // se asume ni se inventa un código.
  async resolveMunicipalityCode(cityLabel: string): Promise<string | null> {
    const alias = await this.prisma.municipalityAlias.findUnique({
      where: { cityLabel },
      select: { divipolaCode: true },
    });

    return alias?.divipolaCode ?? null;
  }
}
