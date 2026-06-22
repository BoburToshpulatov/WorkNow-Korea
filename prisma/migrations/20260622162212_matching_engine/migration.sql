-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE_NOW', 'AVAILABLE_TODAY', 'AVAILABLE_TONIGHT', 'AVAILABLE_TOMORROW', 'WEEKENDS_ONLY', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "UrgencyType" AS ENUM ('WITHIN_2_HOURS', 'TODAY', 'TONIGHT', 'FLEXIBLE');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REHIRE_INVITE';

-- AlterEnum
ALTER TYPE "PaymentTiming" ADD VALUE 'NEGOTIABLE';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "locationNote" TEXT,
ADD COLUMN     "nearPublicTransport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parkingAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shuttleProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transportNote" TEXT,
ADD COLUMN     "urgencyType" "UrgencyType";

-- AlterTable
ALTER TABLE "WorkerProfile" ADD COLUMN     "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE_TODAY',
ADD COLUMN     "currentLatitude" DOUBLE PRECISION,
ADD COLUMN     "currentLongitude" DOUBLE PRECISION;

