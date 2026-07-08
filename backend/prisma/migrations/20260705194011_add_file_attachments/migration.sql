-- CreateEnum
CREATE TYPE "FileEntityType" AS ENUM ('EQUIPMENT', 'WORK_ORDER', 'SERVICE_RECORD', 'CLIENT', 'QUOTATION', 'INVOICE');

-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('PHOTO', 'DOCUMENT', 'CERTIFICATE', 'MANUAL');

-- CreateTable
CREATE TABLE "file_attachments" (
    "id" TEXT NOT NULL,
    "entityType" "FileEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "category" "FileCategory" NOT NULL,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "description" VARCHAR(500),
    "takenAt" TIMESTAMP(3),
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "file_attachments_entityType_entityId_idx" ON "file_attachments"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
