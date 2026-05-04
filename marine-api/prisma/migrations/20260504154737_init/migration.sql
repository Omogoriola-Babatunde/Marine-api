/*
  Warnings:

  - You are about to drop the column `customername` on the `Policy` table. All the data in the column will be lost.
  - Added the required column `customerName` to the `Policy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Policy" DROP COLUMN "customername",
ADD COLUMN     "customerName" TEXT NOT NULL;
