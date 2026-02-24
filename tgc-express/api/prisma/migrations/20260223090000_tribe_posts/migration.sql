-- CreateTable
CREATE TABLE "TribePost" (
    "id" TEXT NOT NULL,
    "tribeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TribePost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TribePost_tribeId_idx" ON "TribePost"("tribeId");

-- CreateIndex
CREATE INDEX "TribePost_userId_idx" ON "TribePost"("userId");

-- CreateIndex
CREATE INDEX "TribePost_tribeId_createdAt_idx" ON "TribePost"("tribeId", "createdAt");

-- AddForeignKey
ALTER TABLE "TribePost" ADD CONSTRAINT "TribePost_tribeId_fkey" FOREIGN KEY ("tribeId") REFERENCES "Tribe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribePost" ADD CONSTRAINT "TribePost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
