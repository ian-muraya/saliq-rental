-- CreateEnum
CREATE TYPE "UnmatchedStatus" AS ENUM ('PENDING', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "unmatched_payments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "mpesaReceipt" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "accountReference" TEXT,
    "transactionId" TEXT,
    "status" "UnmatchedStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "assignedTenantId" TEXT,

    CONSTRAINT "unmatched_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unmatched_payments_mpesaReceipt_key" ON "unmatched_payments"("mpesaReceipt");

-- AddForeignKey
ALTER TABLE "unmatched_payments" ADD CONSTRAINT "unmatched_payments_assignedTenantId_fkey" FOREIGN KEY ("assignedTenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
