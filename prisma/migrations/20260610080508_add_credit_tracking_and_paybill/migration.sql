/*
  Warnings:

  - You are about to drop the column `installmentNumber` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `isInstallment` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `month` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `parentPaymentId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `totalInstallments` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `payments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_parentPaymentId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_userId_fkey";

-- DropIndex
DROP INDEX "payments_month_idx";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "installmentNumber",
DROP COLUMN "isInstallment",
DROP COLUMN "month",
DROP COLUMN "parentPaymentId",
DROP COLUMN "paymentMethod",
DROP COLUMN "totalInstallments",
DROP COLUMN "userId",
ADD COLUMN     "allocatedFrom" TIMESTAMP(3),
ADD COLUMN     "allocatedTo" TIMESTAMP(3),
ADD COLUMN     "monthsCovered" INTEGER,
ADD COLUMN     "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "remainingCredit" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "paybillNumber" TEXT,
ADD COLUMN     "tillNumber" TEXT;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "rentCreditBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rentPaidUntil" TIMESTAMP(3);

-- DropEnum
DROP TYPE "PaymentMethod";

-- CreateIndex
CREATE INDEX "payments_paymentDate_idx" ON "payments"("paymentDate");
