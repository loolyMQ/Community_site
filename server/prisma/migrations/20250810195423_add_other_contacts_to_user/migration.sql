-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "other" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "website" TEXT;
