-- CreateTable
CREATE TABLE "work_order_technicians" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_technicians_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_order_technicians_workOrderId_idx" ON "work_order_technicians"("workOrderId");

-- CreateIndex
CREATE INDEX "work_order_technicians_userId_idx" ON "work_order_technicians"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_technicians_workOrderId_userId_key" ON "work_order_technicians"("workOrderId", "userId");

-- AddForeignKey
ALTER TABLE "work_order_technicians" ADD CONSTRAINT "work_order_technicians_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_technicians" ADD CONSTRAINT "work_order_technicians_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
