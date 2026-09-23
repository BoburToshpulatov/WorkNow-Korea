import { NextRequest, NextResponse } from "next/server";
import { runDocumentCleanup } from "@/lib/document-cleanup";
import { captureError } from "@/lib/error-monitoring";
import { rejectUnauthorizedCron } from "@/lib/cron-auth";

/**
 * Scheduled document cleanup endpoint (Phase 5).
 * Protected by CRON_SECRET (see rejectUnauthorizedCron). Returns 401 without
 * a valid secret.
 */
export async function POST(req: NextRequest) {
  const rejected = rejectUnauthorizedCron(req);
  if (rejected) return rejected;

  try {
    const result = await runDocumentCleanup();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    captureError(e, { operation: "cron.documents-cleanup" });
    return NextResponse.json({ error: "CLEANUP_FAILED" }, { status: 500 });
  }
}

// Allow GET for platforms that issue cron via GET (still secret-protected).
export const GET = POST;
