/*
  Warnings:

  - A unique constraint covering the columns `[homeMephiUserId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."reviews" ADD COLUMN     "homeMephiCourse" INTEGER,
ADD COLUMN     "homeMephiFaculty" TEXT,
ADD COLUMN     "homeMephiFirstName" TEXT,
ADD COLUMN     "homeMephiGroup" TEXT,
ADD COLUMN     "homeMephiLastName" TEXT,
ADD COLUMN     "homeMephiMiddleName" TEXT,
ADD COLUMN     "homeMephiStudentId" TEXT,
ADD COLUMN     "homeMephiUserId" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "homeMephiFirstName" TEXT,
ADD COLUMN     "homeMephiLastName" TEXT,
ADD COLUMN     "homeMephiMiddleName" TEXT,
ADD COLUMN     "homeMephiToken" TEXT,
ADD COLUMN     "homeMephiTokenExpires" TIMESTAMP(3),
ADD COLUMN     "homeMephiUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_homeMephiUserId_key" ON "public"."users"("homeMephiUserId");
