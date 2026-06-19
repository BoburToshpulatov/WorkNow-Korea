/**
 * Next.js instrumentation hook — runs once at server startup.
 * Validates environment configuration so production never boots with unsafe
 * defaults (e.g. local document storage). See src/lib/env.ts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
