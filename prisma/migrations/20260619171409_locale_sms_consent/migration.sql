-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN     "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nightJobsAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "quietHoursEnd" INTEGER,
ADD COLUMN     "quietHoursStart" INTEGER,
ADD COLUMN     "smsConsentAt" TIMESTAMP(3);
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredLocale" TEXT;
