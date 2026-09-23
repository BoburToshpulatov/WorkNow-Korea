-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- Backfill: jobs that have been live get their creation time as an
-- approximation (approval time was not recorded before this migration).
UPDATE "Job" SET "publishedAt" = "createdAt"
WHERE "status" IN ('OPEN', 'FILLED', 'EXPIRED') AND "publishedAt" IS NULL;
