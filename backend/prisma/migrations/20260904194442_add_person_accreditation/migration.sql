-- CreateEnum
CREATE TYPE "PersonProfile" AS ENUM ('TECHNICIAN_INTERNAL', 'TECHNICIAN_EXTERNAL', 'BIOMEDICAL_ENGINEER', 'INDEPENDENT_PROFESSIONAL', 'CONTRACTOR', 'ADMIN_STAFF', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('EMPLOYEE', 'CONTRACTOR', 'INDEPENDENT', 'EXTERNAL_OTHER');

-- CreateEnum
CREATE TYPE "AccreditationStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "personId" TEXT;

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "profile" "PersonProfile" NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accreditations" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "displayRole" TEXT NOT NULL,
    "status" "AccreditationStatus" NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "issuedById" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accreditations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accreditations_qrCode_key" ON "accreditations"("qrCode");

-- CreateIndex
CREATE INDEX "accreditations_personId_idx" ON "accreditations"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "users_personId_key" ON "users"("personId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accreditations" ADD CONSTRAINT "accreditations_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accreditations" ADD CONSTRAINT "accreditations_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

