-- AlterTable
ALTER TABLE "VerificationDocument" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletionReason" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3);
