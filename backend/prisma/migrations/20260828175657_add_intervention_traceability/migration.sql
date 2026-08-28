-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "FileEntityType" ADD VALUE 'INTERVENTION';

-- AlterTable
ALTER TABLE "checklist_items" ADD COLUMN     "interventionId" TEXT;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "clientSignedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "interventions" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "type" "WorkOrderType" NOT NULL,
    "status" "InterventionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "findings" TEXT,
    "activitiesPerformed" TEXT,
    "recommendations" TEXT,
    "occurredAt" TIMESTAMP(3),
    "primaryTechnicianId" TEXT,
    "migratedFromServiceRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migration_log" (
    "id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "sourceTable" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetTable" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "detail" JSONB,
    "migratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migration_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interventions_migratedFromServiceRecordId_key" ON "interventions"("migratedFromServiceRecordId");

-- CreateIndex
CREATE INDEX "interventions_workOrderId_idx" ON "interventions"("workOrderId");

-- CreateIndex
CREATE INDEX "interventions_equipmentId_idx" ON "interventions"("equipmentId");

-- CreateIndex
CREATE INDEX "migration_log_sourceTable_sourceId_idx" ON "migration_log"("sourceTable", "sourceId");

-- CreateIndex
CREATE INDEX "migration_log_targetTable_targetId_idx" ON "migration_log"("targetTable", "targetId");

-- CreateIndex
CREATE INDEX "checklist_items_interventionId_idx" ON "checklist_items"("interventionId");

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_primaryTechnicianId_fkey" FOREIGN KEY ("primaryTechnicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
