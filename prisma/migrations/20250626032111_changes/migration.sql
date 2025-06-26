-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "otpBlockedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "otpBlockedUntil" TIMESTAMP(3);
