-- Run once on the existing Turso production database.
-- This migration adds soft-revoke support and per-share feedback history.

ALTER TABLE "ProcedureShare" ADD COLUMN "revokedAt" DATETIME;

CREATE TABLE "ProcedureShareFeedback" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventType" TEXT NOT NULL,
  "comment" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "shareId" TEXT NOT NULL,
  CONSTRAINT "ProcedureShareFeedback_shareId_fkey"
    FOREIGN KEY ("shareId") REFERENCES "ProcedureShare"("id") ON DELETE CASCADE
);

CREATE INDEX "ProcedureShareFeedback_shareId_createdAt_idx"
  ON "ProcedureShareFeedback"("shareId", "createdAt");

CREATE INDEX "ProcedureShareFeedback_eventType_idx"
  ON "ProcedureShareFeedback"("eventType");

-- Optional compatibility statements if your production DB still predates
-- earlier KB updates. Run only if those columns do not already exist.
-- ALTER TABLE "ProcedureShare" ADD COLUMN "customerComment" TEXT;
-- ALTER TABLE "Article" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
