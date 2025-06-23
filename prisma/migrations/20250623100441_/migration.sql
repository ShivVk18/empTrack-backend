/*
  Warnings:

  - The values [TEAM_LEAD,SUPERVISOR] on the enum `EmployeeRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EmployeeRole_new" AS ENUM ('EMPLOYEE', 'HR', 'MANAGER', 'ACCOUNTANT', 'SR_MANAGER');
ALTER TABLE "employees" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "employees" ALTER COLUMN "role" TYPE "EmployeeRole_new" USING ("role"::text::"EmployeeRole_new");
ALTER TYPE "EmployeeRole" RENAME TO "EmployeeRole_old";
ALTER TYPE "EmployeeRole_new" RENAME TO "EmployeeRole";
DROP TYPE "EmployeeRole_old";
ALTER TABLE "employees" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
COMMIT;

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "isOtpVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpAttemps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpExpiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "isOtpVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpAttemps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpExpiry" TIMESTAMP(3);
