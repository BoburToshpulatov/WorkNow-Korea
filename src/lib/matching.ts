import type { AvailabilityStatus, Prisma } from "@prisma/client";
import type { CategoryValue } from "./constants";

// ── Availability matching (Phase 2) ─────────────────────────────────
/** Statuses that count as "ready right away" — targeted by urgent jobs. */
export const URGENT_READY_STATUSES: AvailabilityStatus[] = [
  "AVAILABLE_NOW",
  "AVAILABLE_TODAY",
  "AVAILABLE_TONIGHT",
];

/**
 * Whether a worker with `status` should be matched to a job.
 * - UNAVAILABLE workers are never matched.
 * - Urgent jobs only reach immediately-available workers.
 * - Regular jobs reach everyone except UNAVAILABLE.
 */
export function isAvailableForJob(
  status: AvailabilityStatus,
  isUrgent: boolean
): boolean {
  if (status === "UNAVAILABLE") return false;
  if (isUrgent) return URGENT_READY_STATUSES.includes(status);
  return true;
}

// ── Feed sorting (Phase 1 & 4) ──────────────────────────────────────
export type JobSort = "nearest" | "highestPay" | "newest" | "urgent";
export const JOB_SORTS: JobSort[] = ["urgent", "nearest", "highestPay", "newest"];

export interface MatchCriteria {
  city?: string; // province / 광역시 (job.city)
  district?: string; // 구/군 (job.district)
  categories?: CategoryValue[];
  urgentOnly?: boolean;
  language?: string;
  // Filter to jobs that overlap any of these spoken languages (worker side).
  languages?: string[];
}

/**
 * Build a Prisma `where` clause for searching OPEN jobs against criteria.
 * Matches by province (city), district, category, language, and urgency.
 * TODO: replace district matching with PostGIS radius once lat/lng is captured.
 */
export function buildJobWhereClause(
  criteria: MatchCriteria
): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = { status: "OPEN" };

  if (criteria.city) {
    where.city = { equals: criteria.city, mode: "insensitive" };
  }

  if (criteria.district) {
    where.district = { equals: criteria.district, mode: "insensitive" };
  }

  if (criteria.categories && criteria.categories.length > 0) {
    where.category = { in: criteria.categories };
  }

  if (criteria.urgentOnly) {
    where.isUrgent = true;
  }

  if (criteria.language) {
    where.languagePreference = { has: criteria.language };
  }

  // Worker-side: show jobs that require no specific language OR overlap the
  // worker's spoken languages.
  if (criteria.languages && criteria.languages.length > 0) {
    where.OR = [
      { languagePreference: { isEmpty: true } },
      { languagePreference: { hasSome: criteria.languages } },
    ];
  }

  return where;
}

/**
 * Rough monthly-equivalent salary so "highest pay" can compare across salary
 * types (hourly vs daily vs monthly). Assumes ~8h/day, ~22 days/month.
 */
export function monthlyEquivalent(amount: number, salaryType: string): number {
  switch (salaryType) {
    case "HOURLY":
      return amount * 8 * 22;
    case "DAILY":
      return amount * 22;
    case "MONTHLY":
      return amount;
    default:
      return amount; // FIXED — compare as-is
  }
}

export interface SortableJob {
  isUrgent: boolean;
  createdAt: Date;
  salaryAmount: number;
  salaryType: string;
  distanceKm?: number | null;
}

/**
 * Sort jobs for the worker feed. `nearest` requires distanceKm; jobs without a
 * distance sink to the bottom. Urgent jobs always tie-break to the top.
 */
export function sortJobs<T extends SortableJob>(jobs: T[], sort: JobSort): T[] {
  const byUrgentThen = (cmp: (a: T, b: T) => number) => (a: T, b: T) =>
    Number(b.isUrgent) - Number(a.isUrgent) || cmp(a, b);

  const sorted = [...jobs];
  switch (sort) {
    case "nearest":
      sorted.sort(
        byUrgentThen(
          (a, b) =>
            (a.distanceKm ?? Number.POSITIVE_INFINITY) -
            (b.distanceKm ?? Number.POSITIVE_INFINITY)
        )
      );
      break;
    case "highestPay":
      sorted.sort(
        byUrgentThen(
          (a, b) =>
            monthlyEquivalent(b.salaryAmount, b.salaryType) -
            monthlyEquivalent(a.salaryAmount, a.salaryType)
        )
      );
      break;
    case "urgent":
      sorted.sort(byUrgentThen((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      break;
    case "newest":
    default:
      sorted.sort(byUrgentThen((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      break;
  }
  return sorted;
}

/**
 * Radius-based job search.
 * TODO: Implement true distance filtering with PostGIS / earthdistance.
 * For the MVP we fall back to city matching only.
 */
export async function getJobsWithinRadius(
  _latitude: number,
  _longitude: number,
  _radiusKm: number
): Promise<never[]> {
  // TODO: PostGIS ST_DWithin query against job latitude/longitude.
  return [];
}
