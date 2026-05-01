-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classType" TEXT NOT NULL,
    "cargoType" TEXT NOT NULL,
    "cargoValue" REAL NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "premium" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyNumber" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "customername" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Policy_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Quote_createdAt_idx" ON "Quote"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_policyNumber_key" ON "Policy"("policyNumber");

-- CreateIndex
CREATE INDEX "Policy_quoteId_idx" ON "Policy"("quoteId");
