/*
  Warnings:

  - You are about to alter the column `salary` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `basicSalary` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `da` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `hra` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `ta` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `esi` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `spall` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `otherDeductions` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `netSalary` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `epf` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `grossSalary` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `medicalAll` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `otherAll` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `professionalTax` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `tds` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `totalDeductions` on the `pay_masters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to drop the column `isActive` on the `pay_parameters` table. All the data in the column will be lost.
  - You are about to alter the column `da` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `ta` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `hra` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `spall` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `esiRate` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `epfRate` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `epfSalaryLimit` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `esiSalaryLimit` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `medicalAllFixed` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `medicalAllRate` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `professionalTaxRate` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `tdsRate` on the `pay_parameters` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to drop the `City` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `State` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[mobileNo]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,employeeType]` on the table `pay_parameters` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `bank_codes` table without a default value. This is not possible if the table is not empty.
  - Made the column `accountNo` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bankCodeId` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `profilePic` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pfAccountNo` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `employeeType` to the `pay_parameters` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('EMPLOYEE', 'HR', 'MANAGER', 'ACCOUNTANT', 'SR_MANAGER', 'TEAM_LEAD', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('TECHNOLOGY', 'HEALTHCARE', 'FINANCE', 'EDUCATION', 'MANUFACTURING', 'RETAIL', 'CONSTRUCTION', 'HOSPITALITY', 'TRANSPORTATION', 'AGRICULTURE', 'REAL_ESTATE', 'MEDIA', 'CONSULTING', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EmployeeType" ADD VALUE 'CONSULTANT';
ALTER TYPE "EmployeeType" ADD VALUE 'PART_TIME';

-- DropForeignKey
ALTER TABLE "City" DROP CONSTRAINT "City_stateId_fkey";

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_cityId_fkey";

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_stateId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_companyId_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_companyId_fkey";

-- DropForeignKey
ALTER TABLE "designations" DROP CONSTRAINT "designations_companyId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_bankCodeId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_cityId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_companyId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_stateId_fkey";

-- DropForeignKey
ALTER TABLE "pay_masters" DROP CONSTRAINT "pay_masters_companyId_fkey";

-- DropForeignKey
ALTER TABLE "pay_parameters" DROP CONSTRAINT "pay_parameters_companyId_fkey";

-- DropForeignKey
ALTER TABLE "pay_parameters" DROP CONSTRAINT "pay_parameters_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "pay_parameters" DROP CONSTRAINT "pay_parameters_designationId_fkey";

-- DropIndex
DROP INDEX "pay_parameters_designationId_departmentId_companyId_key";

-- AlterTable
ALTER TABLE "bank_codes" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "designations" ADD COLUMN     "description" TEXT,
ADD COLUMN     "level" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "role" "EmployeeRole" NOT NULL DEFAULT 'EMPLOYEE',
ALTER COLUMN "salary" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "accountNo" SET NOT NULL,
ALTER COLUMN "bankCodeId" SET NOT NULL,
ALTER COLUMN "profilePic" SET NOT NULL,
ALTER COLUMN "pfAccountNo" SET NOT NULL;

-- AlterTable
ALTER TABLE "pay_masters" ADD COLUMN     "remarks" TEXT,
ALTER COLUMN "basicSalary" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "da" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "hra" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ta" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "esi" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "spall" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "otherDeductions" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "netSalary" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "epf" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "grossSalary" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "medicalAll" DROP DEFAULT,
ALTER COLUMN "medicalAll" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "otherAll" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "professionalTax" DROP DEFAULT,
ALTER COLUMN "professionalTax" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "tds" DROP DEFAULT,
ALTER COLUMN "tds" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "totalDeductions" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "pay_parameters" DROP COLUMN "isActive",
ADD COLUMN     "employeeType" "EmployeeType" NOT NULL,
ALTER COLUMN "designationId" DROP NOT NULL,
ALTER COLUMN "departmentId" DROP NOT NULL,
ALTER COLUMN "da" SET DEFAULT 0,
ALTER COLUMN "da" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ta" SET DEFAULT 0,
ALTER COLUMN "ta" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "hra" SET DEFAULT 0,
ALTER COLUMN "hra" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "spall" SET DEFAULT 0,
ALTER COLUMN "spall" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "esiRate" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "epfRate" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "epfSalaryLimit" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "esiSalaryLimit" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "medicalAllFixed" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "medicalAllRate" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "professionalTaxRate" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "tdsRate" SET DATA TYPE DOUBLE PRECISION;

-- DropTable
DROP TABLE "City";

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "State";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "industry" "Industry" NOT NULL,
    "address" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "cityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" SERIAL NOT NULL,
    "stateName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "cityName" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_mobile_key" ON "admins"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "admins_companyId_key" ON "admins"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "states_stateName_key" ON "states"("stateName");

-- CreateIndex
CREATE UNIQUE INDEX "cities_cityName_stateId_key" ON "cities"("cityName", "stateId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_mobileNo_key" ON "employees"("mobileNo");

-- CreateIndex
CREATE UNIQUE INDEX "pay_parameters_companyId_employeeType_key" ON "pay_parameters"("companyId", "employeeType");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_bankCodeId_fkey" FOREIGN KEY ("bankCodeId") REFERENCES "bank_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designations" ADD CONSTRAINT "designations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_parameters" ADD CONSTRAINT "pay_parameters_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_parameters" ADD CONSTRAINT "pay_parameters_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_parameters" ADD CONSTRAINT "pay_parameters_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_masters" ADD CONSTRAINT "pay_masters_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;
