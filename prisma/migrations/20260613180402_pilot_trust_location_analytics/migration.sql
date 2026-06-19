-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InterestStatus" AS ENUM ('INTERESTED', 'CONTACTED', 'HIRED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_MATCHING_JOB', 'NEW_INTEREST', 'STATUS_CHANGE', 'VERIFICATION_UPDATE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('JOB_CREATED', 'JOB_VIEWED', 'JOB_INTERESTED', 'WORKER_CONTACTED', 'WORKER_HIRED', 'JOB_COMPLETED');

-- AlterTable
ALTER TABLE "EmployerProfile" ADD COLUMN     "businessRegistrationNumber" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "province" TEXT,
DROP COLUMN "verificationStatus",
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'South Korea',
ADD COLUMN     "district" TEXT,
ADD COLUMN     "province" TEXT;

-- AlterTable
ALTER TABLE "JobInterest" ADD COLUMN     "status" "InterestStatus" NOT NULL DEFAULT 'INTERESTED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "WorkerProfile" ADD COLUMN     "preferredDistrict" TEXT,
ADD COLUMN     "preferredProvince" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "jobId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "userId" TEXT,
    "jobId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

