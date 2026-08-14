-- CreateEnum
CREATE TYPE "DocumentShareType" AS ENUM ('QUOTATION', 'INVOICE', 'SERVICE_RECORD');

-- CreateTable
CREATE TABLE "document_shares" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "DocumentShareType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceNumber" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "sizeBytes" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_shares_token_key" ON "document_shares"("token");

-- CreateIndex
CREATE INDEX "document_shares_type_sourceId_idx" ON "document_shares"("type", "sourceId");

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
