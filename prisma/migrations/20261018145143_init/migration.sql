-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Garment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "GarmentEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "garmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GarmentEvent_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "garmentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Label_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Garment_userId_createdAt_idx" ON "Garment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GarmentEvent_garmentId_createdAt_idx" ON "GarmentEvent"("garmentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Label_garmentId_key" ON "Label"("garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Label_token_key" ON "Label"("token");
