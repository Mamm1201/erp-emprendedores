-- CreateEnum
CREATE TYPE "RetentionConcept" AS ENUM ('RETE_FUENTE', 'RETE_ICA');

-- CreateEnum
CREATE TYPE "RetentionJurisdiction" AS ENUM ('NACIONAL', 'BOGOTA', 'FACATATIVA');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "isIcaRetentionAgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isIncomeTaxRetentionAgent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "retentionsApplied" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "quotation_retention_lines" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "concept" "RetentionConcept" NOT NULL,
    "jurisdictionSnapshot" "RetentionJurisdiction",
    "taxpayerConditionSnapshot" TEXT,
    "rateSnapshot" DECIMAL(5,3) NOT NULL,
    "legalSourceSnapshot" TEXT NOT NULL,
    "estimatedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_retention_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_rates" (
    "id" TEXT NOT NULL,
    "concept" "RetentionConcept" NOT NULL,
    "jurisdiction" "RetentionJurisdiction" NOT NULL,
    "taxpayerConditionNote" TEXT,
    "rate" DECIMAL(5,3) NOT NULL,
    "minimumBaseUvt" DECIMAL(6,2),
    "uvtValueSnapshot" DECIMAL(10,2),
    "legalSource" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotation_retention_lines_quotationId_idx" ON "quotation_retention_lines"("quotationId");

-- CreateIndex
CREATE INDEX "retention_rates_concept_jurisdiction_idx" ON "retention_rates"("concept", "jurisdiction");

-- AddForeignKey
ALTER TABLE "quotation_retention_lines" ADD CONSTRAINT "quotation_retention_lines_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
