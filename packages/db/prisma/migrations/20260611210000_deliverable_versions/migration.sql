-- CreateTable
CREATE TABLE "DeliverableVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliverableId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "language" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliverableVersion_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliverableVersion_deliverableId_version_key" ON "DeliverableVersion"("deliverableId", "version");

-- Backfill: the current head of each existing deliverable becomes its only
-- known version row (earlier blobs were deleted on re-upload, so v<head is
-- genuinely gone for pre-existing rows).
INSERT INTO "DeliverableVersion" ("id", "deliverableId", "version", "fileName", "storageKey", "size", "sha256", "language", "createdAt")
SELECT lower(hex(randomblob(12))), "id", "version", "fileName", "storageKey", "size", "sha256", "language", "updatedAt" FROM "Deliverable";
