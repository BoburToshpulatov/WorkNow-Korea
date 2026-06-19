/**
 * Rate limiting with two backends (Phase 4):
 *   - memory: in-process sliding window (development only; resets per instance)
 *   - redis:  Upstash Redis REST (production-safe, shared across instances)
 *
 * RATE_LIMIT_PROVIDER selects the backend. Production should use redis —
 * checkRateLimitConfig() warns/fails otherwise.
 */
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/** Synchronous in-memory limiter (kept for simple/dev callers). */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }
  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// ── Redis (Upstash) backend ─────────────────────────────────────────
const PROVIDER = process.env.RATE_LIMIT_PROVIDER ?? "memory";
let _redisLimiters: Map<string, Ratelimit> | null = null;

function redisLimiter(limit: number, windowMs: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redisLimiters ??= new Map();
  const cacheKey = `${limit}:${windowMs}`;
  let lim = _redisLimiters.get(cacheKey);
  if (!lim) {
    lim = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
      prefix: "worknow:rl",
    });
    _redisLimiters.set(cacheKey, lim);
  }
  return lim;
}

async function check(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (PROVIDER === "redis") {
    const lim = redisLimiter(limit, windowMs);
    if (lim) {
      const { success } = await lim.limit(key);
      return success;
    }
    // Misconfigured redis → fail closed to memory so we still throttle.
  }
  return rateLimit(key, limit, windowMs).success;
}

/**
 * Route guard. Returns a bilingual 429 NextResponse when the limit is
 * exceeded, or null when the request may proceed.
 */
export async function enforceRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): Promise<NextResponse | null> {
  const ok = await check(key, limit, windowMs);
  if (ok) return null;
  return NextResponse.json(
    {
      error: "RATE_LIMITED",
      message:
        "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요. / Too many requests. Please try again shortly.",
    },
    { status: 429 }
  );
}

/** Best-effort client key from headers (IP) for unauthenticated routes. */
export function clientKey(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

/** Config check used by the rate-limit:check script + ops. */
export function checkRateLimitConfig(): { provider: string; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (PROVIDER === "redis") {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      errors.push("RATE_LIMIT_PROVIDER=redis but UPSTASH_REDIS_REST_URL/TOKEN are missing.");
    }
  } else if (process.env.APP_ENV === "production") {
    warnings.push("Using in-memory rate limiting in production — set RATE_LIMIT_PROVIDER=redis.");
  }
  return { provider: PROVIDER, errors, warnings };
}

export const rateLimitProvider = PROVIDER;
