/*
  Warnings:

  - You are about to drop the column `jurisdictionSnapshot` on the `quotation_retention_lines` table. All the data in the column will be lost.
  - You are about to drop the column `jurisdiction` on the `retention_rates` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "retention_rates_concept_jurisdiction_idx";

-- AlterTable
ALTER TABLE "quotation_retention_lines" DROP COLUMN "jurisdictionSnapshot",
ADD COLUMN     "estimatedAmountMax" DECIMAL(12,2),
ADD COLUMN     "estimatedAmountMin" DECIMAL(12,2),
ADD COLUMN     "municipalityCodeSnapshot" TEXT,
ADD COLUMN     "rateMaxSnapshot" DECIMAL(5,3),
ADD COLUMN     "rateMinSnapshot" DECIMAL(5,3),
ALTER COLUMN "rateSnapshot" DROP NOT NULL,
ALTER COLUMN "estimatedAmount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "retention_rates" DROP COLUMN "jurisdiction",
ADD COLUMN     "municipalityCode" TEXT,
ADD COLUMN     "rateMax" DECIMAL(5,3),
ADD COLUMN     "rateMin" DECIMAL(5,3),
ALTER COLUMN "rate" DROP NOT NULL;

-- DropEnum
DROP TYPE "RetentionJurisdiction";

-- CreateTable
CREATE TABLE "municipality_aliases" (
    "id" TEXT NOT NULL,
    "cityLabel" TEXT NOT NULL,
    "divipolaCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipality_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "municipality_aliases_cityLabel_key" ON "municipality_aliases"("cityLabel");

-- CreateIndex
CREATE INDEX "retention_rates_concept_municipalityCode_idx" ON "retention_rates"("concept", "municipalityCode");

-- CheckConstraint (agregado manualmente, no generado por Prisma)
-- Invariante: RETE_FUENTE es nacional (sin municipio); RETE_ICA siempre exige municipio.
ALTER TABLE "retention_rates" ADD CONSTRAINT "retention_rates_municipality_by_concept_check" CHECK (
  ("concept" = 'RETE_FUENTE' AND "municipalityCode" IS NULL) OR
  ("concept" = 'RETE_ICA' AND "municipalityCode" IS NOT NULL)
);

-- CheckConstraint (agregado manualmente, no generado por Prisma)
-- Invariante: tarifa puntual (rate) o rango (rateMin+rateMax), nunca ambos ni ninguno.
ALTER TABLE "retention_rates" ADD CONSTRAINT "retention_rates_rate_point_or_range_check" CHECK (
  ("rate" IS NOT NULL AND "rateMin" IS NULL AND "rateMax" IS NULL) OR
  ("rate" IS NULL AND "rateMin" IS NOT NULL AND "rateMax" IS NOT NULL AND "rateMax" >= "rateMin")
);

-- CheckConstraint (agregado manualmente, no generado por Prisma)
-- Mismo invariante de municipio, espejado sobre el snapshot congelado en la cotización.
ALTER TABLE "quotation_retention_lines" ADD CONSTRAINT "quotation_retention_lines_municipality_by_concept_check" CHECK (
  ("concept" = 'RETE_FUENTE' AND "municipalityCodeSnapshot" IS NULL) OR
  ("concept" = 'RETE_ICA' AND "municipalityCodeSnapshot" IS NOT NULL)
);

-- CheckConstraint (agregado manualmente, no generado por Prisma)
-- Mismo invariante de tarifa puntual/rango, espejado sobre rateSnapshot/rateMinSnapshot/rateMaxSnapshot.
ALTER TABLE "quotation_retention_lines" ADD CONSTRAINT "quotation_retention_lines_rate_point_or_range_check" CHECK (
  ("rateSnapshot" IS NOT NULL AND "rateMinSnapshot" IS NULL AND "rateMaxSnapshot" IS NULL) OR
  ("rateSnapshot" IS NULL AND "rateMinSnapshot" IS NOT NULL AND "rateMaxSnapshot" IS NOT NULL AND "rateMaxSnapshot" >= "rateMinSnapshot")
);

-- CheckConstraint (agregado manualmente, no generado por Prisma)
-- Mismo invariante puntual/rango sobre el monto estimado congelado.
ALTER TABLE "quotation_retention_lines" ADD CONSTRAINT "quotation_retention_lines_estimated_point_or_range_check" CHECK (
  ("estimatedAmount" IS NOT NULL AND "estimatedAmountMin" IS NULL AND "estimatedAmountMax" IS NULL) OR
  ("estimatedAmount" IS NULL AND "estimatedAmountMin" IS NOT NULL AND "estimatedAmountMax" IS NOT NULL AND "estimatedAmountMax" >= "estimatedAmountMin")
);
