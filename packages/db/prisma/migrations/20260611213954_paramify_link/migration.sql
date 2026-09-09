-- CreateTable
CREATE TABLE "ParamifyLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliverableId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "validatorId" TEXT NOT NULL,
    "syncedVersion" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ParamifyLink_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ParamifyLink_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ParamifyLink_deliverableId_teamId_key" ON "ParamifyLink"("deliverableId", "teamId");
