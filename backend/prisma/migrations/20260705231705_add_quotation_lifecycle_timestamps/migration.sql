-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "cancellationNotes" VARCHAR(500),
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionNotes" VARCHAR(1000),
ADD COLUMN     "sentAt" TIMESTAMP(3);
