/*
  Warnings:

  - You are about to drop the column `image` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "image",
ADD COLUMN     "profilePic" TEXT;
