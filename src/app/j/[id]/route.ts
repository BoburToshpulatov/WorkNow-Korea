import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Short job link used in SMS alerts (`/j/<jobId>`) — keeps texts within
 * length limits. Sends logged-out workers through login and back to the job.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const target = `/worker/jobs/${encodeURIComponent(id)}`;
  const session = await auth();
  const url = session?.user
    ? new URL(target, req.url)
    : new URL(`/login?next=${encodeURIComponent(target)}`, req.url);
  return NextResponse.redirect(url);
}
