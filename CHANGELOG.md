# Changelog

All notable changes to WorkNow Korea are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/).
Versioning: `MAJOR.MINOR.PATCH` with a pre-release suffix during pilot
(e.g. `0.1.0-pilot`). Release tags use the `v` prefix: `v0.1.0-pilot`.

## [0.2.1-pilot] — 2026-06-22

Multilingual correctness pass. No new features — Korean, English, and Uzbek
now work reliably and consistently across the app.

### Fixed
- **Uzbek was unreachable** — the language switcher disabled the Uzbek option
  ("beta"); it is now selectable.
- **Wrong fallback** — untranslated keys fell back uz → ko (mixed Korean).
  Fallback is now uz → en → ko (and en → ko), so admin screens read cleanly in
  English instead of leaking Korean.
- **Hardcoded strings moved to catalogs** — job-feed empty state, admin user
  table headers/roles, and all server-generated notification titles/bodies
  (interest, application status, verification, document review).
- **Locale-aware formatting** — Uzbek salary (`Kuniga 120,000 von`), 24-hour
  Uzbek/Korean time vs 12-hour English, and Uzbek relative time (date-fns `uz`).

### Added
- **Uzbek translations** for all user-facing flows (worker, employer, public,
  shared) — 204 previously-missing keys, including the full employer and
  job-form namespaces.
- **`npm run i18n:check`** — fails if English is missing any key or Uzbek is
  missing a user-facing key; allows admin-only Uzbek fallback. Wired into CI.
- **`I18N_QA.md`** — language QA checklist and formatting reference.

### Notes
- Admin screens and legal documents intentionally fall back (admin → English;
  legal → Korean reference text).

## [0.2.0-pilot] — 2026-06-22

Core marketplace matching engine. No new product surfaces — sharpens the loop:
employer needs workers now → nearby, available workers are alerted → reliable
workers get rehired.

### Added
- **Location awareness** — `calculateDistanceKm` (Haversine) + distance utils;
  job feed shows localized distance ("2.3 km away"), sort by nearest / highest
  pay / newest / urgent, and within-5/10/20/50 km filters (graceful when the
  worker has no saved location). Worker profile captures current lat/lng.
- **Worker availability** — `AvailabilityStatus` (NOW/TODAY/TONIGHT/TOMORROW/
  WEEKENDS_ONLY/UNAVAILABLE); one-click selector on the worker dashboard;
  shown on employer applicant cards. UNAVAILABLE workers are never alerted;
  urgent jobs only reach immediately-available workers.
- **Urgent matching** — `UrgencyType` (WITHIN_2_HOURS/TODAY/TONIGHT/FLEXIBLE);
  urgent badge + urgency label on cards/detail; urgent jobs sort first and get
  urgency-led, localized SMS + in-app templates.
- **Payment visibility** — `PaymentTiming.NEGOTIABLE`; payment-timing filter
  and highest-pay sort (normalized across hourly/daily/monthly).
- **Transport info** — job fields nearPublicTransport / parkingAvailable /
  shuttleProvided / pickupAvailable / transportNote; badges on cards and a
  transport section on job detail; inputs in the job form.
- **Employer rehire** — `NotificationType.REHIRE_INVITE`; rehire page lists
  workers who completed jobs (with count, last worked, rating) and sends an
  in-app + SMS invite to an open job. Workers can accept or ignore.
- **Seed** — Daegu/Busan/Incheon coordinates, worker availability statuses and
  SMS opt-ins, urgent + same-day + transport-rich jobs.
- **Matching test** — added availability-gating assertions (UNAVAILABLE never
  matched; AVAILABLE_TOMORROW excluded from urgent, included in regular).

### Notes
- Distance filtering/sorting is in-memory (TODO markers for Kakao/Naver
  geocoding and PostGIS radius). Still out of scope: payments, maps UI, PASS,
  business registry API, additional languages.

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
