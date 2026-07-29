-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('MATERIAL', 'LABOR', 'EXPENSE');

-- CreateEnum
CREATE TYPE "ResourceOrigin" AS ENUM ('PLANNED', 'ADDITIONAL');

-- CreateTable
CREATE TABLE "resource_utilizations" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "resourceName" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "origin" "ResourceOrigin" NOT NULL,
    "observation" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_utilizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resource_utilizations_workOrderId_idx" ON "resource_utilizations"("workOrderId");

-- AddForeignKey
ALTER TABLE "resource_utilizations" ADD CONSTRAINT "resource_utilizations_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_utilizations" ADD CONSTRAINT "resource_utilizations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
