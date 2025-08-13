-- AlterTable
ALTER TABLE "public"."communities" ADD COLUMN     "mainCategoryId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."communities" ADD CONSTRAINT "communities_mainCategoryId_fkey" FOREIGN KEY ("mainCategoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
