-- CreateTable
CREATE TABLE "Outfit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Outfit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutfitItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfitId" TEXT NOT NULL,
    "garmentId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "OutfitItem_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OutfitItem_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Outfit_userId_updatedAt_idx" ON "Outfit"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "OutfitItem_garmentId_idx" ON "OutfitItem"("garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "OutfitItem_outfitId_garmentId_key" ON "OutfitItem"("outfitId", "garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "OutfitItem_outfitId_position_key" ON "OutfitItem"("outfitId", "position");
