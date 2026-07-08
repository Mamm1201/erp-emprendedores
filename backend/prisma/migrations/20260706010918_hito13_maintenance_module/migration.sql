/*
  Warnings:

  - You are about to drop the column `branchId` on the `maintenance_plans` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `maintenance_plans` table. All the data in the column will be lost.
  - You are about to drop the column `contractEndDate` on the `maintenance_plans` table. All the data in the column will be lost.
  - You are about to drop the column `contractStartDate` on the `maintenance_plans` table. All the data in the column will be lost.
  - You are about to drop the column `nextVisitDate` on the `maintenance_plans` table. All the data in the column will be lost.
  - You are about to drop the column `equipmentId` on the `service_records` table. All the data in the column will be lost.
  - Added the required column `contractId` to the `maintenance_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `maintenance_plans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkOrderType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION');

-- CreateEnum
CREATE TYPE "EquipmentCriticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ServiceHoursLevel" AS ENUM ('BUSINESS_HOURS', 'EXTENDED', 'FULL_TIME');

-- CreateEnum
CREATE TYPE "MaintenanceVisitStatus" AS ENUM ('PENDING', 'GENERATED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'MAINTENANCE_CONTRACT';

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_workOrderId_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_plans" DROP CONSTRAINT "maintenance_plans_branchId_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_plans" DROP CONSTRAINT "maintenance_plans_clientId_fkey";

-- DropForeignKey
ALTER TABLE "service_records" DROP CONSTRAINT "service_records_equipmentId_fkey";

-- DropIndex
DROP INDEX "maintenance_plans_clientId_idx";

-- DropIndex
DROP INDEX "maintenance_plans_nextVisitDate_idx";

-- DropIndex
DROP INDEX "service_records_equipmentId_idx";

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "criticality" "EquipmentCriticality" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "warrantyExpiresAt" DATE;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "contractId" TEXT,
ALTER COLUMN "workOrderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "maintenance_plans" DROP COLUMN "branchId",
DROP COLUMN "clientId",
DROP COLUMN "contractEndDate",
DROP COLUMN "contractStartDate",
DROP COLUMN "nextVisitDate",
ADD COLUMN     "contractId" TEXT NOT NULL,
ADD COLUMN     "startDate" DATE NOT NULL;

-- AlterTable
ALTER TABLE "service_records" DROP COLUMN "equipmentId";

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "equipmentId" TEXT,
ADD COLUMN     "type" "WorkOrderType" NOT NULL DEFAULT 'CORRECTIVE';

-- CreateTable
CREATE TABLE "maintenance_contracts" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "billingCycle" "BillingCycle" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "signedAt" TIMESTAMP(3),
    "signedById" TEXT,
    "quotationId" TEXT,
    "correctiveIncluded" BOOLEAN NOT NULL DEFAULT false,
    "partsIncluded" BOOLEAN NOT NULL DEFAULT false,
    "transportIncluded" BOOLEAN NOT NULL DEFAULT false,
    "serviceHours" "ServiceHoursLevel" NOT NULL DEFAULT 'BUSINESS_HOURS',
    "slaHoursCritical" INTEGER,
    "slaHoursHigh" INTEGER,
    "slaHoursMedium" INTEGER,
    "slaHoursLow" INTEGER,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_equipment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "contract_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_plan_equipment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "maintenance_plan_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_visits" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "windowEnd" DATE,
    "status" "MaintenanceVisitStatus" NOT NULL DEFAULT 'PENDING',
    "workOrderId" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_contracts_number_key" ON "maintenance_contracts"("number");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_contracts_quotationId_key" ON "maintenance_contracts"("quotationId");

-- CreateIndex
CREATE INDEX "maintenance_contracts_clientId_status_idx" ON "maintenance_contracts"("clientId", "status");

-- CreateIndex
CREATE INDEX "maintenance_contracts_endDate_idx" ON "maintenance_contracts"("endDate");

-- CreateIndex
CREATE INDEX "contract_equipment_equipmentId_idx" ON "contract_equipment"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_equipment_contractId_equipmentId_key" ON "contract_equipment"("contractId", "equipmentId");

-- CreateIndex
CREATE INDEX "maintenance_plan_equipment_equipmentId_idx" ON "maintenance_plan_equipment"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_plan_equipment_planId_equipmentId_key" ON "maintenance_plan_equipment"("planId", "equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_visits_workOrderId_key" ON "maintenance_visits"("workOrderId");

-- CreateIndex
CREATE INDEX "maintenance_visits_planId_scheduledDate_idx" ON "maintenance_visits"("planId", "scheduledDate");

-- CreateIndex
CREATE INDEX "maintenance_visits_status_scheduledDate_idx" ON "maintenance_visits"("status", "scheduledDate");

-- CreateIndex
CREATE INDEX "equipment_criticality_idx" ON "equipment"("criticality");

-- CreateIndex
CREATE INDEX "invoices_contractId_idx" ON "invoices"("contractId");

-- CreateIndex
CREATE INDEX "maintenance_plans_contractId_idx" ON "maintenance_plans"("contractId");

-- CreateIndex
CREATE INDEX "work_orders_equipmentId_idx" ON "work_orders"("equipmentId");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "maintenance_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_contracts" ADD CONSTRAINT "maintenance_contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_contracts" ADD CONSTRAINT "maintenance_contracts_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_contracts" ADD CONSTRAINT "maintenance_contracts_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_equipment" ADD CONSTRAINT "contract_equipment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "maintenance_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_equipment" ADD CONSTRAINT "contract_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "maintenance_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plan_equipment" ADD CONSTRAINT "maintenance_plan_equipment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "maintenance_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plan_equipment" ADD CONSTRAINT "maintenance_plan_equipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_visits" ADD CONSTRAINT "maintenance_visits_planId_fkey" FOREIGN KEY ("planId") REFERENCES "maintenance_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_visits" ADD CONSTRAINT "maintenance_visits_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Business rule: every invoice must reference a work order OR a maintenance contract
ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_requires_reference"
  CHECK ("workOrderId" IS NOT NULL OR "contractId" IS NOT NULL);
