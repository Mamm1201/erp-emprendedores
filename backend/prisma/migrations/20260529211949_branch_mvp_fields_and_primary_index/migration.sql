-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "department" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "notes" TEXT;

-- CreateIndex
CREATE INDEX "branches_clientId_name_idx" ON "branches"("clientId", "name");
