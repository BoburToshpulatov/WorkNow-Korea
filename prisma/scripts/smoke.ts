/**
 * Post-deploy smoke test against a running deployment.
 * Run: npm run smoke -- https://staging.example.com
 * Optional: CRON_SECRET=... to also exercise the job-expiry cron.
 * Read-only apart from the (idempotent) cron call. Exits non-zero on failure.
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
let failures = 0;

function check(ok: boolean, label: string, detail = "") {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function get(path: string, init?: RequestInit) {
  return fetch(`${base}${path}`, { redirect: "manual", ...init });
}

async function main() {
  console.log(`Smoke testing ${base}\n`);

  const health = await get("/api/health");
  const h = await health.json().catch(() => ({}));
  check(health.status === 200 && h.db === "ok", "health: 200, db ok", `status ${health.status}, db ${h.db}`);
  console.log(
    `    appEnv=${h.appEnv} storage=${h.uploadStorage} rateLimit=${h.rateLimitProvider} ` +
      `sms=${h.notificationProvider} monitoring=${h.errorMonitoring} commit=${h.commit ?? "?"}`
  );
  if (h.appEnv && h.appEnv !== "development") {
    check(h.uploadStorage === "s3", "deployed: S3 storage");
    check(h.rateLimitProvider === "redis", "deployed: redis rate limiting");
  }

  const home = await get("/");
  check(home.status === 200 && (await home.text()).includes("WorkNow"), "home page renders");

  const login = await get("/login");
  check(login.status === 200, "login page renders", `status ${login.status}`);

  const short = await get("/j/smoke-test");
  const loc = short.headers.get("location") ?? "";
  check(
    short.status >= 300 && short.status < 400 && loc.includes("/login?next="),
    "SMS short link redirects logged-out users to login",
    loc
  );

  const cronNoAuth = await get("/api/cron/jobs-expire");
  check(cronNoAuth.status === 401, "cron rejects missing secret", `status ${cronNoAuth.status}`);

  const doc = await get("/api/verification/documents/smoke-test");
  check([401, 403, 404].includes(doc.status), "verification documents not public", `status ${doc.status}`);

  if (process.env.CRON_SECRET) {
    const cron = await get("/api/cron/jobs-expire", {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const c = await cron.json().catch(() => ({}));
    check(cron.status === 200 && c.ok === true, "job-expiry cron runs", `expired ${c.expired ?? "?"}`);
  } else {
    console.log("  – skipped cron run (set CRON_SECRET to include it)");
  }

  console.log(failures === 0 ? "\n✅ Smoke test passed." : `\n❌ ${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(`✗ Could not reach ${base}:`, e instanceof Error ? e.message : e);
  process.exit(1);
});
