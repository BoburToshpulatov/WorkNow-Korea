import type { Prisma } from "@prisma/client";
import type { CategoryValue } from "./constants";

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
