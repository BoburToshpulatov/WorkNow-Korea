import { NextRequest, NextResponse } from "next/server";
import { expireStaleJobs } from "@/lib/job-expiry";
import { captureError } from "@/lib/error-monitoring";
import { rejectUnauthorizedCron } from "@/lib/cron-auth";

/**
 * Scheduled job expiry: flips OPEN/PENDING jobs past their start-time grace
 * window to EXPIRED. Feeds already hide them at query time; this keeps the
 * stored status honest for employers and admins. Run hourly.
 */
export async function POST(req: NextRequest) {
  const rejected = rejectUnauthorizedCron(req);
  if (rejected) return rejected;

  try {
    const result = await expireStaleJobs();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    captureError(e, { operation: "cron.jobs-expire" });
    return NextResponse.json({ error: "EXPIRE_FAILED" }, { status: 500 });
  }
}

// Allow GET for platforms that issue cron via GET (still secret-protected).
export const GET = POST;
