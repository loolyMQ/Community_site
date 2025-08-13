-- CreateTable
CREATE TABLE "public"."community_relationships" (
    "id" TEXT NOT NULL,
    "sourceCommunityId" TEXT NOT NULL,
    "targetCommunityId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL DEFAULT 'COLLABORATION',
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_relationships_sourceCommunityId_targetCommunityId_key" ON "public"."community_relationships"("sourceCommunityId", "targetCommunityId");

-- AddForeignKey
ALTER TABLE "public"."community_relationships" ADD CONSTRAINT "community_relationships_sourceCommunityId_fkey" FOREIGN KEY ("sourceCommunityId") REFERENCES "public"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_relationships" ADD CONSTRAINT "community_relationships_targetCommunityId_fkey" FOREIGN KEY ("targetCommunityId") REFERENCES "public"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
