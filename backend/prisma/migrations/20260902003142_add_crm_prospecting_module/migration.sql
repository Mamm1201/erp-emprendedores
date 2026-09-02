-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('LINKEDIN', 'REFERRAL', 'INBOUND', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('IPS', 'CLINIC', 'HOSPITAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SizePotential" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE_PROSPECT', 'CUSTOMER', 'DORMANT', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('IPS_MANAGER', 'ADMIN_DIRECTOR', 'INFRASTRUCTURE_DIRECTOR', 'MAINTENANCE_COORDINATOR', 'HOSPITAL_ENGINEERING', 'BIOMEDICAL_MANAGER', 'PROCUREMENT', 'QUALITY_COMPLIANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "InfluenceLevel" AS ENUM ('DECISION_MAKER', 'INFLUENCER', 'GATEKEEPER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('IDENTIFIED', 'RESEARCHING', 'CONTACTED', 'CONVERSING', 'MEETING_DIAGNOSIS', 'QUOTED', 'NEGOTIATING', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "OpportunityPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LINKEDIN', 'EMAIL', 'WHATSAPP', 'CALL', 'MEETING', 'NOTE', 'PROPOSAL', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "opportunityId" TEXT;

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "nit" TEXT,
    "city" TEXT NOT NULL,
    "institutionType" "InstitutionType" NOT NULL,
    "sizePotential" "SizePotential" NOT NULL,
    "website" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE_PROSPECT',
    "source" "LeadSource" NOT NULL,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "promotedClientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "role" "ContactRole" NOT NULL,
    "area" TEXT,
    "linkedinUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "influenceLevel" "InfluenceLevel" NOT NULL DEFAULT 'UNKNOWN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "primaryContactId" TEXT,
    "title" TEXT NOT NULL,
    "detectedNeed" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "priority" "OpportunityPriority" NOT NULL DEFAULT 'MEDIUM',
    "stage" "OpportunityStage" NOT NULL DEFAULT 'IDENTIFIED',
    "source" "LeadSource" NOT NULL,
    "probability" INTEGER,
    "potentialValue" DECIMAL(12,2),
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "contactId" TEXT,
    "type" "ActivityType" NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'COMPLETED',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "outcome" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OpportunityToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityToService_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_promotedClientId_key" ON "accounts"("promotedClientId");

-- CreateIndex
CREATE INDEX "accounts_legalName_idx" ON "accounts"("legalName");

-- CreateIndex
CREATE INDEX "accounts_status_idx" ON "accounts"("status");

-- CreateIndex
CREATE INDEX "accounts_ownerId_idx" ON "accounts"("ownerId");

-- CreateIndex
CREATE INDEX "contacts_accountId_idx" ON "contacts"("accountId");

-- CreateIndex
CREATE INDEX "contacts_branchId_idx" ON "contacts"("branchId");

-- CreateIndex
CREATE INDEX "opportunities_accountId_idx" ON "opportunities"("accountId");

-- CreateIndex
CREATE INDEX "opportunities_stage_idx" ON "opportunities"("stage");

-- CreateIndex
CREATE INDEX "opportunities_ownerId_idx" ON "opportunities"("ownerId");

-- CreateIndex
CREATE INDEX "activities_accountId_idx" ON "activities"("accountId");

-- CreateIndex
CREATE INDEX "activities_opportunityId_idx" ON "activities"("opportunityId");

-- CreateIndex
CREATE INDEX "activities_status_idx" ON "activities"("status");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- CreateIndex
CREATE INDEX "_OpportunityToService_B_index" ON "_OpportunityToService"("B");

-- CreateIndex
CREATE INDEX "quotations_opportunityId_idx" ON "quotations"("opportunityId");

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_promotedClientId_fkey" FOREIGN KEY ("promotedClientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityToService" ADD CONSTRAINT "_OpportunityToService_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityToService" ADD CONSTRAINT "_OpportunityToService_B_fkey" FOREIGN KEY ("B") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
