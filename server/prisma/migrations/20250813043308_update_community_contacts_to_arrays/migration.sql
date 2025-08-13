/*
  Warnings:

  - The `phone` column on the `communities` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `telegram` column on the `communities` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `vk` column on the `communities` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `website` column on the `communities` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."communities" DROP COLUMN "phone",
ADD COLUMN     "phone" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "telegram",
ADD COLUMN     "telegram" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "vk",
ADD COLUMN     "vk" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "website",
ADD COLUMN     "website" TEXT[] DEFAULT ARRAY[]::TEXT[];
