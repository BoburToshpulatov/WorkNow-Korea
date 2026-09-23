import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { rateLimitProvider } from "@/lib/rate-limit";

// Must run per request — a GET handler with no request access is otherwise
// prerendered at build time, freezing "db ok" and the build's env into the
// response.
export const dynamic = "force-dynamic";

/**
 * Public health check (Phase 6). Returns operational status + non-sensitive
 * configuration so uptime monitors and the ops team can verify the deploy.
 * Never exposes secrets, URLs with credentials, or keys.
 */
export async function GET() {
  let db = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "down";
  }

  const body = {
    status: db === "ok" ? "ok" : "degraded",
    db,
    appEnv: env.appEnv,
    notificationProvider: env.notificationProvider,
    uploadStorage: env.uploadStorage,
    rateLimitProvider,
    errorMonitoring: env.enableErrorMonitoring,
    // Which build is live — lets smoke tests confirm the expected deploy.
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: db === "ok" ? 200 : 503 });
}
