import type { DurationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Job expiry. Jobs have no end date, so a job stops being "live" once its
 * start time is older than a grace window that depends on the duration type.
 * Short gigs go stale within a day; monthly roles keep recruiting longer.
 *
 * Enforced twice: `liveJobWhere()` hides stale jobs at query time (so the
 * feed is correct even if cron lags), and `expireStaleJobs()` (cron) flips
 * them to EXPIRED so employers and admins see the real state.
 */
const DAY_MS = 86_400_000;

export const JOB_EXPIRY_GRACE_MS: Record<DurationType, number> = {
  HOURLY: 1 * DAY_MS,
  DAILY: 1 * DAY_MS,
  MULTI_DAY: 7 * DAY_MS,
  MONTHLY: 30 * DAY_MS,
};

export function isJobExpired(
  job: { startDateTime: Date; durationType: DurationType },
  now: Date = new Date()
): boolean {
  return (
    job.startDateTime.getTime() + JOB_EXPIRY_GRACE_MS[job.durationType] <
    now.getTime()
  );
}

/** Where-clause fragment matching jobs whose start time is still within grace. */
export function notExpiredWhere(now: Date = new Date()): Prisma.JobWhereInput {
  return {
    OR: (Object.keys(JOB_EXPIRY_GRACE_MS) as DurationType[]).map((d) => ({
      durationType: d,
      startDateTime: { gte: new Date(now.getTime() - JOB_EXPIRY_GRACE_MS[d]) },
    })),
  };
}

/** Mark OPEN/PENDING jobs past their grace window as EXPIRED. */
export async function expireStaleJobs(now: Date = new Date()) {
  const { count } = await prisma.job.updateMany({
    where: {
      status: { in: ["OPEN", "PENDING"] },
      NOT: notExpiredWhere(now),
    },
    data: { status: "EXPIRED" },
  });
  return { expired: count };
}
