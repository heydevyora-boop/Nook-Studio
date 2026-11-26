-- CreateEnum
CREATE TYPE "SheetsSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- AlterTable
-- Existing rows get sheetsSyncStatus = 'PENDING' via the column default, so the
-- background worker mirrors historical inquiries to the sheet (oldest first)
-- the first time Google Sheets is configured. See server/README.md for how to
-- opt out of that if the sheet should only receive new inquiries.
ALTER TABLE "inquiries" ADD COLUMN     "sheetsLastError" TEXT,
ADD COLUMN     "sheetsNextAttemptAt" TIMESTAMP(3),
ADD COLUMN     "sheetsSyncAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sheetsSyncStatus" "SheetsSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "sheetsSyncedAt" TIMESTAMP(3),
ADD COLUMN     "submissionKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "inquiries_submissionKey_key" ON "inquiries"("submissionKey");

-- CreateIndex
CREATE INDEX "inquiries_sheetsSyncStatus_sheetsNextAttemptAt_idx" ON "inquiries"("sheetsSyncStatus", "sheetsNextAttemptAt");
