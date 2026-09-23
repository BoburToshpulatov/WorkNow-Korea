import { NextRequest, NextResponse } from "next/server";

/**
 * Guard for scheduled endpoints. Accepts CRON_SECRET via
 * `Authorization: Bearer <secret>` (Vercel Cron sends this automatically) or
 * `?secret=`. Returns an error response to send, or null when authorized.
 */
export function rejectUnauthorizedCron(req: NextRequest): NextResponse | null {
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
  return null;
}
