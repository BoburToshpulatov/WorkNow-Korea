import { prisma } from "./prisma";
import { notExpiredWhere } from "./job-expiry";

/**
 * Marketplace liquidity — the pilot's north-star numbers. The product promise
 * is "urgent job posted → a worker responds within 2 hours", so we measure the
 * time from publish to first applicant and first hire, and surface live jobs
 * nobody has responded to yet so ops can step in by hand.
 */
export const URGENT_RESPONSE_TARGET_MS = 2 * 60 * 60 * 1000;
/** A live job with no applicant after this long is "stalled". */
const STALLED_AFTER_MS = 30 * 60 * 1000;

export interface DistrictLiquidity {
  district: string;
  published: number;
  withApplicant: number;
}

export interface StalledJob {
  id: string;
  title: string;
  district: string | null;
  isUrgent: boolean;
  publishedAt: Date;
}

export interface LiquidityMetrics {
  published: number;
  withApplicant: number;
  medianMsToFirstApplicant: number | null;
  urgentPublished: number;
  urgentAnsweredInTarget: number;
  withHire: number;
  medianMsToFirstHire: number | null;
  filled: number;
  interests: number;
  interestsViaCall: number;
  byDistrict: DistrictLiquidity[];
  stalled: StalledJob[];
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Liquidity for jobs published since `since` (all time when undefined). */
export async function getLiquidityMetrics(since?: Date): Promise<LiquidityMetrics> {
  const now = new Date();
  const [jobs, callInterests, allInterests, stalledRows] = await Promise.all([
    prisma.job.findMany({
      where: { publishedAt: since ? { gte: since } : { not: null } },
      select: {
        id: true,
        district: true,
        isUrgent: true,
        publishedAt: true,
        workersNeeded: true,
        interests: { select: { createdAt: true, status: true } },
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        type: "JOB_INTERESTED",
        metadata: { path: ["source"], equals: "call" },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    }),
    prisma.analyticsEvent.count({
      where: { type: "JOB_INTERESTED", ...(since ? { createdAt: { gte: since } } : {}) },
    }),
    prisma.job.findMany({
      where: {
        status: "OPEN",
        AND: [notExpiredWhere(now)],
        publishedAt: { lte: new Date(now.getTime() - STALLED_AFTER_MS) },
        interests: { none: {} },
      },
      select: { id: true, title: true, district: true, isUrgent: true, publishedAt: true },
      orderBy: [{ isUrgent: "desc" }, { publishedAt: "asc" }],
      take: 20,
    }),
  ]);

  const firstHires = await prisma.analyticsEvent.groupBy({
    by: ["jobId"],
    where: { type: "WORKER_HIRED", jobId: { in: jobs.map((j) => j.id) } },
    _min: { createdAt: true },
  });
  const firstHireAt = new Map(firstHires.map((h) => [h.jobId, h._min.createdAt]));

  const toApplicant: number[] = [];
  const toHire: number[] = [];
  let urgentPublished = 0;
  let urgentAnsweredInTarget = 0;
  let filled = 0;
  const districts = new Map<string, DistrictLiquidity>();

  for (const job of jobs) {
    const published = job.publishedAt!.getTime();
    const first = job.interests.reduce<number | null>((min, i) => {
      const t = i.createdAt.getTime();
      return min == null || t < min ? t : min;
    }, null);
    // Interests recorded before publish (backfilled data) count as instant.
    const msToApplicant = first == null ? null : Math.max(0, first - published);
    if (msToApplicant != null) toApplicant.push(msToApplicant);

    if (job.isUrgent) {
      urgentPublished++;
      if (msToApplicant != null && msToApplicant <= URGENT_RESPONSE_TARGET_MS) {
        urgentAnsweredInTarget++;
      }
    }

    const hiredAt = firstHireAt.get(job.id);
    if (hiredAt) toHire.push(Math.max(0, hiredAt.getTime() - published));

    const hires = job.interests.filter((i) =>
      ["HIRED", "COMPLETED"].includes(i.status)
    ).length;
    if (hires >= job.workersNeeded) filled++;

    const key = job.district ?? "—";
    const d = districts.get(key) ?? { district: key, published: 0, withApplicant: 0 };
    d.published++;
    if (first != null) d.withApplicant++;
    districts.set(key, d);
  }

  return {
    published: jobs.length,
    withApplicant: toApplicant.length,
    medianMsToFirstApplicant: median(toApplicant),
    urgentPublished,
    urgentAnsweredInTarget,
    withHire: toHire.length,
    medianMsToFirstHire: median(toHire),
    filled,
    interests: allInterests,
    interestsViaCall: callInterests,
    byDistrict: Array.from(districts.values()).sort((a, b) => b.published - a.published).slice(0, 8),
    stalled: stalledRows.map((j) => ({ ...j, publishedAt: j.publishedAt! })),
  };
}
