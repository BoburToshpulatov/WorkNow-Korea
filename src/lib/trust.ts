import { prisma } from "./prisma";
import type { TrustTier } from "./constants";

/**
 * Simple, explainable trust tiers. Deliberately NOT a weighted black-box score.
 *   NEW          — unverified / brand new
 *   VERIFIED     — identity/business verified
 *   RELIABLE     — verified + completed jobs + average rating >= 4
 *   NEEDS_REVIEW — flagged: open reports / repeated no-shows
 */

const RELIABLE_MIN_RATING = 4;

export interface EmployerStats {
  verified: boolean;
  flaggedForReview: boolean;
  jobsPosted: number;
  completedJobs: number;
  openReports: number;
  avgRating: number | null;
  reviewCount: number;
  joinedAt: Date;
}

export interface WorkerStats {
  verified: boolean;
  completedJobs: number;
  noShowCount: number;
  avgRating: number | null;
  reviewCount: number;
  joinedAt: Date;
}

export function employerTier(s: EmployerStats): TrustTier {
  if (s.flaggedForReview || s.openReports >= 3) return "NEEDS_REVIEW";
  if (
    s.verified &&
    s.completedJobs >= 1 &&
    (s.avgRating ?? 0) >= RELIABLE_MIN_RATING
  )
    return "RELIABLE";
  if (s.verified) return "VERIFIED";
  return "NEW";
}

export function workerTier(s: WorkerStats): TrustTier {
  if (s.noShowCount >= 3) return "NEEDS_REVIEW";
  if (
    s.verified &&
    s.completedJobs >= 1 &&
    (s.avgRating ?? 0) >= RELIABLE_MIN_RATING
  )
    return "RELIABLE";
  if (s.verified) return "VERIFIED";
  return "NEW";
}

async function ratingFor(revieweeId: string) {
  const agg = await prisma.review.aggregate({
    where: { revieweeId },
    _avg: { rating: true },
    _count: true,
  });
  return {
    avgRating: agg._avg.rating ?? null,
    reviewCount: agg._count,
  };
}

/** Gather employer trust stats. openReports counts OPEN/REVIEWING reports on
 *  any of the employer's jobs. avgRating is over reviews of the employer user. */
export async function getEmployerStats(
  employerProfileId: string
): Promise<EmployerStats> {
  const employer = await prisma.employerProfile.findUnique({
    where: { id: employerProfileId },
    include: { jobs: { select: { id: true } } },
  });
  if (!employer) {
    return {
      verified: false,
      flaggedForReview: false,
      jobsPosted: 0,
      completedJobs: 0,
      openReports: 0,
      avgRating: null,
      reviewCount: 0,
      joinedAt: new Date(),
    };
  }
  const jobIds = employer.jobs.map((j) => j.id);
  const [completedJobs, openReports, rating] = await Promise.all([
    prisma.jobInterest.count({
      where: { jobId: { in: jobIds }, status: "COMPLETED" },
    }),
    jobIds.length
      ? prisma.report.count({
          where: { jobId: { in: jobIds }, status: { in: ["OPEN", "REVIEWING"] } },
        })
      : Promise.resolve(0),
    ratingFor(employer.userId),
  ]);
  return {
    verified: employer.verificationStatus === "VERIFIED",
    flaggedForReview: employer.flaggedForReview,
    jobsPosted: employer.jobs.length,
    completedJobs,
    openReports,
    avgRating: rating.avgRating,
    reviewCount: rating.reviewCount,
    joinedAt: employer.createdAt,
  };
}

/** Gather worker trust stats from their interest history + reviews. */
export async function getWorkerStats(userId: string): Promise<WorkerStats> {
  const profile = await prisma.workerProfile.findUnique({ where: { userId } });
  const [completedJobs, noShowCount, rating] = await Promise.all([
    prisma.jobInterest.count({ where: { userId, status: "COMPLETED" } }),
    prisma.jobInterest.count({ where: { userId, status: "NO_SHOW" } }),
    ratingFor(userId),
  ]);
  return {
    verified: profile?.verificationStatus === "VERIFIED",
    completedJobs,
    noShowCount,
    avgRating: rating.avgRating,
    reviewCount: rating.reviewCount,
    joinedAt: profile?.createdAt ?? new Date(),
  };
}
