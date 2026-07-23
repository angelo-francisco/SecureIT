-- AlterTable: Plan - rename price to basePrice, change currency default, add isDefault, add updatedAt
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "durationDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Plan" ("id", "name", "description", "basePrice", "currency", "durationDays", "isActive", "createdAt") SELECT "id", "name", "description", "price", "EUR", "durationDays", "isActive", "createdAt" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";

-- AlterTable: PaymentRequest - add selectedFeatures, selectedServices, totalPrice
CREATE TABLE "new_PaymentRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "paymentInfoId" TEXT NOT NULL,
    "proofPublicId" TEXT NOT NULL,
    "proofUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "selectedFeatures" TEXT,
    "selectedServices" TEXT,
    "totalPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    CONSTRAINT "PaymentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentRequest_paymentInfoId_fkey" FOREIGN KEY ("paymentInfoId") REFERENCES "PaymentInfo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PaymentRequest" ("id", "userId", "planId", "paymentInfoId", "proofPublicId", "proofUrl", "status", "adminNote", "createdAt", "reviewedAt") SELECT "id", "userId", "planId", "paymentInfoId", "proofPublicId", "proofUrl", "status", "adminNote", "createdAt", "reviewedAt" FROM "PaymentRequest";
DROP TABLE "PaymentRequest";
ALTER TABLE "new_PaymentRequest" RENAME TO "PaymentRequest";
CREATE INDEX "PaymentRequest_userId_idx" ON "PaymentRequest"("userId");

-- CreateTable: PlanFeature
CREATE TABLE "PlanFeature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PlanFeature_planId_name_key" ON "PlanFeature"("planId", "name");

-- CreateTable: PlanService
CREATE TABLE "PlanService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanService_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PlanService_planId_name_key" ON "PlanService"("planId", "name");

-- CreateTable: MaintenanceRequest
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "proofPublicId" TEXT,
    "proofUrl" TEXT,
    "adminNote" TEXT,
    "hasPaidLicense" BOOLEAN NOT NULL DEFAULT false,
    "totalPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
