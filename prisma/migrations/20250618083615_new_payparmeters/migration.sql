/*
  Warnings:

  - You are about to drop the column `ept` on the `pay_masters` table. All the data in the column will be lost.
  - You are about to drop the column `gross` on the `pay_masters` table. All the data in the column will be lost.
  - You are about to drop the column `eptRate` on the `pay_parameters` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `epf` to the `pay_masters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grossSalary` to the `pay_masters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDeductions` to the `pay_masters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pay_masters" DROP COLUMN "ept",
DROP COLUMN "gross",
ADD COLUMN     "epf" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "grossSalary" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "medicalAll" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otherAll" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "professionalTax" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tds" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalDeductions" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "pay_parameters" DROP COLUMN "eptRate",
ADD COLUMN     "epfRate" DECIMAL(5,2) NOT NULL DEFAULT 12.00,
ADD COLUMN     "epfSalaryLimit" DECIMAL(10,2) NOT NULL DEFAULT 15000,
ADD COLUMN     "esiSalaryLimit" DECIMAL(10,2) NOT NULL DEFAULT 25000,
ADD COLUMN     "medicalAllFixed" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "medicalAllRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "professionalTaxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tdsRate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Company_id_key" ON "Company"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_companyId_key" ON "User"("companyId");
