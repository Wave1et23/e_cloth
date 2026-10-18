/*
  Warnings:

  - Added the required column `seq` to the `Garment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Garment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "primaryColor" TEXT,
    "pattern" TEXT,
    "fit" TEXT,
    "season" TEXT,
    "style" TEXT,
    "material" TEXT,
    "brand" TEXT DEFAULT 'uncertain',
    "priceCents" INTEGER,
    "purchaseDate" DATETIME,
    "notes" TEXT,
    "photoPath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_CLOSET',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Garment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Garment" ("brand", "category", "createdAt", "fit", "id", "material", "name", "notes", "pattern", "photoPath", "priceCents", "primaryColor", "purchaseDate", "season", "status", "style", "updatedAt", "userId") SELECT "brand", "category", "createdAt", "fit", "id", "material", "name", "notes", "pattern", "photoPath", "priceCents", "primaryColor", "purchaseDate", "season", "status", "style", "updatedAt", "userId" FROM "Garment";
DROP TABLE "Garment";
ALTER TABLE "new_Garment" RENAME TO "Garment";
CREATE INDEX "Garment_userId_createdAt_idx" ON "Garment"("userId", "createdAt");
CREATE UNIQUE INDEX "Garment_userId_seq_key" ON "Garment"("userId", "seq");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
