# Changelog

All notable changes to WorkNow Korea are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/).
Versioning: `MAJOR.MINOR.PATCH` with a pre-release suffix during pilot
(e.g. `0.1.0-pilot`). Release tags use the `v` prefix: `v0.1.0-pilot`.

## [0.1.0-pilot] — 2026-06-19

First pilot-ready release. Job **information** platform (not an employment
agency) connecting employers and workers for on-demand/daily labor in Korea.

### Added
- **Marketplace MVP** — worker job feed with filters, job detail, save &
  "I'm interested"; employer post/edit/cancel jobs, applicant list (masked phone);
  admin dashboard and job moderation.
- **Multilingual worker experience** — Korean (default), English, and Uzbek;
  cookie-based UI locale plus per-user `preferredLocale`; missing keys fall back
  to Korean.
- **Notifications** — in-app inbox; worker alert matching by region/category;
  per-user preferences (master, in-app, SMS, night jobs, quiet hours).
- **SMS provider architecture** — real Solapi/Coolsms (HMAC) + generic adapter
  behind a mock-safe abstraction; locale-aware templates; consent + quiet-hours +
  night-job gating; delivery logging (SENT/FAILED/MOCKED). Mocked until vendor
  keys are configured.
- **Trust system** — trust tiers and badges, scoring.
- **Verification** — employer/worker verification workflows.
- **Document upload** — Local + S3-compatible storage abstraction, private
  buckets, retention/cleanup.
- **Admin tools** — moderation, reports, founder/ops/analytics dashboards,
  Test SMS tool, SMS delivery logs.
- **Production hardening** — env validation at startup, rate limiting
  (memory/Upstash Redis), Sentry error monitoring, scheduled document cleanup,
  health endpoint.
- **GitHub / CI readiness** — `.gitignore` hardening, `npm run secrets:check`,
  CONTRIBUTING, CODE_OF_CONDUCT, issue/PR templates, GitHub Actions CI
  (Node 22), staging deployment plan, release checklist.

### Notes
- Out of scope for this phase: payments, maps, PASS identity, business registry
  API, additional languages.
