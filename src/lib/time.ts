/**
 * Korea time helpers. Servers (Vercel) run in UTC, so never use
 * Date#getHours() for business logic — the service operates in KST (UTC+9,
 * no daylight saving).
 */
export const APP_TIME_ZONE = "Asia/Seoul";

/** Hour of day (0–23) in KST. */
export function kstHour(d: Date): number {
  return (d.getUTCHours() + 9) % 24;
}
