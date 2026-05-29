-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "branchAddress" TEXT,
ADD COLUMN     "branchCity" TEXT,
ADD COLUMN     "branchContactName" TEXT,
ADD COLUMN     "branchContactPhone" TEXT,
ADD COLUMN     "branchDepartment" TEXT,
ADD COLUMN     "branchName" TEXT,
ADD COLUMN     "clientLegalName" TEXT,
ADD COLUMN     "clientTaxId" TEXT,
ADD COLUMN     "snapshotAt" TIMESTAMP(3);
