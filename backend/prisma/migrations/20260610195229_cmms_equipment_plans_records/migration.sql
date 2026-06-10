-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('NURSE_CALL', 'MEDICAL_ALERT', 'GENERATOR', 'UPS', 'ELECTRICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "MaintenanceFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'EVERY_4_MONTHS', 'BIANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ChecklistResult" AS ENUM ('OK', 'WARNING', 'FAIL', 'NA');

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "installDate" DATE,
    "location" TEXT,
    "notes" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_plans" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "branchId" TEXT,
    "frequency" "MaintenanceFrequency" NOT NULL,
    "contractStartDate" DATE NOT NULL,
    "contractEndDate" DATE,
    "nextVisitDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "findings" TEXT,
    "activitiesPerformed" TEXT,
    "recommendations" TEXT,
    "clientSignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "serviceRecordId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "result" "ChecklistResult" NOT NULL DEFAULT 'NA',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_branchId_idx" ON "equipment"("branchId");

-- CreateIndex
CREATE INDEX "equipment_type_idx" ON "equipment"("type");

-- CreateIndex
CREATE INDEX "maintenance_plans_clientId_idx" ON "maintenance_plans"("clientId");

-- CreateIndex
CREATE INDEX "maintenance_plans_nextVisitDate_idx" ON "maintenance_plans"("nextVisitDate");

-- CreateIndex
CREATE INDEX "maintenance_plans_isActive_idx" ON "maintenance_plans"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "service_records_workOrderId_key" ON "service_records"("workOrderId");

-- CreateIndex
CREATE INDEX "service_records_equipmentId_idx" ON "service_records"("equipmentId");

-- CreateIndex
CREATE INDEX "checklist_items_serviceRecordId_idx" ON "checklist_items"("serviceRecordId");

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "service_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
