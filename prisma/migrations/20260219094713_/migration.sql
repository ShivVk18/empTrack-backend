/*
  Warnings:

  - The values [ADMIN] on the enum `EmployeeRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `mobile` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `PayParameter` table. All the data in the column will be lost.
  - You are about to drop the column `designationId` on the `PayParameter` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[countryCode,mobileNo]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[countryCode,mobileNo]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,employeeType,effectiveDate]` on the table `PayParameter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `countryCode` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobileNo` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryCode` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `LeaveApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basicSalary` to the `PayMaster` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EmployeeRole_new" AS ENUM ('EMPLOYEE', 'HR', 'MANAGER', 'ACCOUNTANT', 'SR_MANAGER');
ALTER TABLE "Employee" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Employee" ALTER COLUMN "role" TYPE "EmployeeRole_new" USING ("role"::text::"EmployeeRole_new");
ALTER TYPE "EmployeeRole" RENAME TO "EmployeeRole_old";
ALTER TYPE "EmployeeRole_new" RENAME TO "EmployeeRole";
DROP TYPE "EmployeeRole_old";
ALTER TABLE "Employee" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
COMMIT;

-- DropForeignKey
ALTER TABLE "PayParameter" DROP CONSTRAINT "PayParameter_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "PayParameter" DROP CONSTRAINT "PayParameter_designationId_fkey";

-- DropIndex
DROP INDEX "Admin_mobile_key";

-- DropIndex
DROP INDEX "Employee_mobileNo_key";

-- DropIndex
DROP INDEX "PayParameter_companyId_departmentId_designationId_employeeT_key";

-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "mobile",
ADD COLUMN     "countryCode" TEXT NOT NULL,
ADD COLUMN     "mobileNo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "countryCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LeaveApplication" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PayMaster" ADD COLUMN     "basicSalary" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "PayParameter" DROP COLUMN "departmentId",
DROP COLUMN "designationId";

-- CreateIndex
CREATE UNIQUE INDEX "Admin_countryCode_mobileNo_key" ON "Admin"("countryCode", "mobileNo");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_countryCode_mobileNo_key" ON "Employee"("countryCode", "mobileNo");

-- CreateIndex
CREATE UNIQUE INDEX "PayParameter_companyId_employeeType_effectiveDate_key" ON "PayParameter"("companyId", "employeeType", "effectiveDate");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
