/**
 * Rate-limit config + behavior check (Phase 4). Run: npm run rate-limit:check
 */
import { enforceRateLimit, checkRateLimitConfig } from "../../src/lib/rate-limit";

async function main() {
  const cfg = checkRateLimitConfig();
  console.log(`Rate limit provider: ${cfg.provider}`);
  cfg.warnings.forEach((w) => console.warn(`⚠ ${w}`));
  cfg.errors.forEach((e) => console.error(`✗ ${e}`));

  // Behavior test: 6 hits with limit 5 → the 6th must be blocked.
  const key = `selftest:${Date.now()}`;
  let blocked = 0;
  for (let i = 0; i < 6; i++) {
    const res = await enforceRateLimit(key, 5, 60_000);
    if (res) blocked++;
  }
  console.log(`Blocked ${blocked}/1 expected after exceeding the limit.`);

  const ok = cfg.errors.length === 0 && blocked === 1;
  console.log(ok ? "\n✅ Rate limit check passed." : "\n❌ Rate limit check failed.");
  process.exit(ok ? 0 : 1);
}

main();
