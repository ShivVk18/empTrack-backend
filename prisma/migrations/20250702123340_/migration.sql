/*
  Warnings:

  - You are about to drop the column `cityId` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `stateId` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `bankCodeId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `cityId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `stateId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the `BankCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `City` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `State` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cityName` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryName` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stateName` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bankCode` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cityName` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryName` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stateName` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "City" DROP CONSTRAINT "City_stateId_fkey";

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_cityId_fkey";

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_stateId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_bankCodeId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_cityId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_stateId_fkey";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "cityId",
DROP COLUMN "stateId",
ADD COLUMN     "cityName" TEXT NOT NULL,
ADD COLUMN     "countryName" TEXT NOT NULL,
ADD COLUMN     "stateName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "bankCodeId",
DROP COLUMN "cityId",
DROP COLUMN "stateId",
ADD COLUMN     "bankCode" TEXT NOT NULL,
ADD COLUMN     "cityName" TEXT NOT NULL,
ADD COLUMN     "countryName" TEXT NOT NULL,
ADD COLUMN     "stateName" TEXT NOT NULL;

-- DropTable
DROP TABLE "BankCode";

-- DropTable
DROP TABLE "City";

-- DropTable
DROP TABLE "State";
