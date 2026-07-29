-- AlterTable (aditivo: columna nullable para enlazar la Cuenta de Cobro con su Preparación)
ALTER TABLE "invoices" ADD COLUMN "preparationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "invoices_preparationId_key" ON "invoices"("preparationId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_preparationId_fkey" FOREIGN KEY ("preparationId") REFERENCES "billing_preparations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
