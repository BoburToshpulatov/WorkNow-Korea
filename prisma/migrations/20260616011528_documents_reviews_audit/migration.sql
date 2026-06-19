-- CreateEnum
CREATE TYPE "DocumentOwnerType" AS ENUM ('WORKER', 'EMPLOYER');
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BUSINESS_REGISTRATION', 'ID_CARD', 'VISA_DOCUMENT', 'OTHER');
-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
-- CreateEnum
CREATE TYPE "ReviewerRole" AS ENUM ('WORKER', 'EMPLOYER');
-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "ownerType" "DocumentOwnerType" NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "originalFilename" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "adminNote" TEXT,
    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "reviewerRole" "ReviewerRole" NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "VerificationDocument_ownerUserId_status_idx" ON "VerificationDocument"("ownerUserId", "status");
-- CreateIndex
CREATE INDEX "VerificationDocument_status_uploadedAt_idx" ON "VerificationDocument"("status", "uploadedAt");
-- CreateIndex
CREATE INDEX "Review_revieweeId_idx" ON "Review"("revieweeId");
-- CreateIndex
CREATE UNIQUE INDEX "Review_jobId_reviewerId_revieweeId_key" ON "Review"("jobId", "reviewerId", "revieweeId");
-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
