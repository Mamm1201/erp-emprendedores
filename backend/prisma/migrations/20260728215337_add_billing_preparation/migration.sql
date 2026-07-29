-- CreateEnum
CREATE TYPE "BillingPreparationStatus" AS ENUM ('DRAFT', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "BillingResolution" AS ENUM ('CHARGE', 'ABSORB');

-- CreateEnum
CREATE TYPE "BillingResolutionSource" AS ENUM ('RULE', 'DISCRETIONARY');

-- CreateTable
CREATE TABLE "billing_preparations" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "status" "BillingPreparationStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "billing_preparations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_line_resolutions" (
    "id" TEXT NOT NULL,
    "billingPreparationId" TEXT NOT NULL,
    "utilizationId" TEXT NOT NULL,
    "resolution" "BillingResolution" NOT NULL,
    "source" "BillingResolutionSource" NOT NULL DEFAULT 'DISCRETIONARY',
    "billableQuantity" DECIMAL(12,3),
    "unitPrice" DECIMAL(12,2),
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_line_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_preparations_workOrderId_key" ON "billing_preparations"("workOrderId");

-- CreateIndex
CREATE INDEX "billing_line_resolutions_billingPreparationId_idx" ON "billing_line_resolutions"("billingPreparationId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_line_resolutions_billingPreparationId_utilizationId_key" ON "billing_line_resolutions"("billingPreparationId", "utilizationId");

-- AddForeignKey
ALTER TABLE "billing_preparations" ADD CONSTRAINT "billing_preparations_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_preparations" ADD CONSTRAINT "billing_preparations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_preparations" ADD CONSTRAINT "billing_preparations_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_line_resolutions" ADD CONSTRAINT "billing_line_resolutions_billingPreparationId_fkey" FOREIGN KEY ("billingPreparationId") REFERENCES "billing_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_line_resolutions" ADD CONSTRAINT "billing_line_resolutions_utilizationId_fkey" FOREIGN KEY ("utilizationId") REFERENCES "resource_utilizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
