/*
  Warnings:

  - The values [PENDING,APPROVED,REJECTED] on the enum `QuoteStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `rate` on the `User` table. All the data in the column will be lost.
  - Added the required column `InvoiceValue` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exchangeRate` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mode` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proformaInvoice` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Policy` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "QuoteStatus_new" AS ENUM ('GENERATED', 'CONVERTED', 'EXPIRED');
ALTER TABLE "Quote" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Quote" ALTER COLUMN "status" TYPE "QuoteStatus_new" USING ("status"::text::"QuoteStatus_new");
ALTER TYPE "QuoteStatus" RENAME TO "QuoteStatus_old";
ALTER TYPE "QuoteStatus_new" RENAME TO "QuoteStatus";
DROP TYPE "QuoteStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Policy" ADD COLUMN     "InvoiceValue" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "exchangeRate" TEXT NOT NULL,
ADD COLUMN     "mode" TEXT NOT NULL,
ADD COLUMN     "naicomId" TEXT,
ADD COLUMN     "proformaInvoice" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "rate",
ADD COLUMN     "classARate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "classBRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
