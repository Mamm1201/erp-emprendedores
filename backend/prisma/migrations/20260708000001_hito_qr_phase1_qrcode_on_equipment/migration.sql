-- QR Phase 1: add opaque qrCode identifier to Equipment
-- Nullable: existing equipment has no QR code until one is generated from the ERP.
-- Unique constraint enforces one code per asset; index supports fast lookup by code.

ALTER TABLE "equipment" ADD COLUMN "qrCode" TEXT;

CREATE UNIQUE INDEX "equipment_qrCode_key" ON "equipment"("qrCode");

CREATE INDEX "equipment_qrCode_idx" ON "equipment"("qrCode");
