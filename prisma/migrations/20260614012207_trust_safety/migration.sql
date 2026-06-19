-- CreateEnum
CREATE TYPE "VisaCategory" AS ENUM ('KOREAN_CITIZEN', 'F_VISA', 'E9', 'H2', 'D_VISA_STUDENT', 'TOURIST_NOT_ELIGIBLE', 'OTHER', 'PREFER_NOT_TO_SAY');
-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('FAKE_JOB', 'UNPAID_WAGE', 'UNSAFE_WORK', 'WRONG_SALARY', 'HARASSMENT', 'SCAM_SPAM', 'NO_SHOW', 'OTHER');
-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');
-- AlterEnum
ALTER TYPE "VerificationStatus" ADD VALUE 'NEEDS_MORE_INFO';
-- AlterTable
ALTER TABLE "EmployerProfile" ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "representativeName" TEXT,
ADD COLUMN     "verificationNote" TEXT;
-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "reasonCode" "ReportReason" NOT NULL DEFAULT 'OTHER',
DROP COLUMN "status",
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'OPEN';
-- AlterTable
ALTER TABLE "WorkerProfile" ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "verificationNote" TEXT,
ADD COLUMN     "visaCategory" "VisaCategory";
-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
