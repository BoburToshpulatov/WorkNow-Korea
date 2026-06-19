import { NextRequest, NextResponse } from "next/server";
import { runDocumentCleanup } from "@/lib/document-cleanup";
import { captureError } from "@/lib/error-monitoring";

/**
 * Scheduled document cleanup endpoint (Phase 5).
 * Protected by CRON_SECRET via `Authorization: Bearer <secret>` (Vercel Cron
 * sends this automatically) or `?secret=`. Returns 401 without a valid secret.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_NOT_CONFIGURED" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  const provided =
    auth?.replace(/^Bearer\s+/i, "") ?? req.nextUrl.searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
