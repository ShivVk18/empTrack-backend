/*
  Warnings:

  - You are about to drop the column `tfAccountNo` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "tfAccountNo",
ADD COLUMN     "pfAccountNo" TEXT;
