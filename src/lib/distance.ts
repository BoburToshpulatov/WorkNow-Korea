/**
 * Distance utilities for location-aware matching (Phase 1).
 *
 * Pure math only — no map provider, no network. Distance is computed from
 * latitude/longitude already stored on jobs and worker profiles.
 *
 * TODO (future, do not block pilot):
 *   - Kakao geocoding: convert job/worker addresses → lat/lng.
 *   - Naver geocoding: alternative geocoder for Korean addresses.
 *   - PostGIS radius matching: replace in-memory filtering with
 *     ST_DWithin(geography) so distance filters run in the database.
 */
import { translate, type Locale } from "./i18n";

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two points in kilometres (Haversine formula).
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export interface Coords {
  latitude?: number | null;
  longitude?: number | null;
}

/** Distance between two coord-bearing records, or null if either lacks coords. */
export function distanceBetween(a: Coords, b: Coords): number | null {
  if (
    a.latitude == null ||
    a.longitude == null ||
    b.latitude == null ||
    b.longitude == null
  ) {
    return null;
  }
  return calculateDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
}

/**
 * Localized distance label, e.g. "2.3 km away" / "2.3km 거리" / "2.3 km uzoqlikda".
 * Uses the `jobs.distanceAway` catalog key with a {km} variable.
 */
export function formatDistance(km: number, locale: Locale): string {
  const value = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  return translate("match.distanceAway", locale, { km: value });
}

/** Distance-filter buckets exposed in the job feed UI. */
export const DISTANCE_BUCKETS_KM = [5, 10, 20, 50] as const;
export type DistanceBucket = (typeof DISTANCE_BUCKETS_KM)[number];
