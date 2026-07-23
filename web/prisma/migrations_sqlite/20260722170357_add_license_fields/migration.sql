/*
  Warnings:

  - You are about to drop the column `machineHash` on the `License` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentRequestId" TEXT,
    "activatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "lastChecked" DATETIME,
    "hardwareFp" TEXT,
    "signedPayload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "License_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "LicenseKey" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "License_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "License_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_License" ("activatedAt", "createdAt", "expiresAt", "id", "keyId", "lastChecked", "paymentRequestId", "userId") SELECT "activatedAt", "createdAt", "expiresAt", "id", "keyId", "lastChecked", "paymentRequestId", "userId" FROM "License";
DROP TABLE "License";
ALTER TABLE "new_License" RENAME TO "License";
CREATE UNIQUE INDEX "License_keyId_key" ON "License"("keyId");
CREATE UNIQUE INDEX "License_userId_key" ON "License"("userId");
CREATE UNIQUE INDEX "License_paymentRequestId_key" ON "License"("paymentRequestId");
CREATE INDEX "License_userId_idx" ON "License"("userId");
CREATE TABLE "new_LicenseKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "maxCameras" INTEGER NOT NULL DEFAULT -1,
    "maxPeople" INTEGER NOT NULL DEFAULT -1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "batchName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_LicenseKey" ("batchName", "createdAt", "durationDays", "id", "key", "status", "type") SELECT "batchName", "createdAt", "durationDays", "id", "key", "status", "type" FROM "LicenseKey";
DROP TABLE "LicenseKey";
ALTER TABLE "new_LicenseKey" RENAME TO "LicenseKey";
CREATE UNIQUE INDEX "LicenseKey_key_key" ON "LicenseKey"("key");
CREATE INDEX "LicenseKey_key_idx" ON "LicenseKey"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
