# Changelog

All notable changes to WorkNow Korea are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/).
Versioning: `MAJOR.MINOR.PATCH` with a pre-release suffix during pilot
(e.g. `0.1.0-pilot`). Release tags use the `v` prefix: `v0.1.0-pilot`.

## [Unreleased]

Launch-readiness fixes found by walking the worker flow on mobile.

### Fixed
- **Stale jobs stayed open forever.** Jobs now expire once their start time
  passes a grace window (1 day hourly/daily, 7 multi-day, 30 monthly). Feeds,
  job detail, and "I'm interested" enforce it at query time; a new hourly
  `/api/cron/jobs-expire` (and `npm run jobs:expire`) sets `EXPIRED` status.
  Admins can no longer approve an already-expired job.
- **"Night" filter returned nothing for Korean jobs** (it searched for the
  English word "night"). Night = "tonight" urgency, a 20:00–04:59 KST start, or
  야간/심야/night/tungi in the title/duration.
- **Mobile feed showed 7 dropdowns before the first job.** Quick chips are one
  scrollable row; sort + a "Filters (n)" toggle replace the rest on mobile.
- Duplicate "전체 급여" label on the payment-timing filter.
- Urgent badge was hardcoded English; `i18n:scan` now also catches multi-line
  JSX text.
- Homepage showed invented audience numbers (1,200+ jobs / 3,500+ workers);
  replaced with verifiable facts (₩0 worker fees, 3 languages, 1 free post).

- **Times were computed in the server's timezone (UTC on Vercel).** Quiet
  hours, night-job detection, and every rendered/SMS start time were 9 hours
  off in production; all now use KST (`src/lib/time.ts`).
- Jobs could be posted with ₩0 or below-minimum-wage pay. Job forms now
  enforce the 2026 minimum wage (₩10,320/h; daily 4h floor; monthly 209h).
- Jobs could be posted with a start time already past the expiry window.

### Changed
- **Verified employers' jobs go live immediately** and alert workers at once;
  unverified or flagged employers still go through admin approval.
- **Quick post** prefills from the employer's last job, defaults the start to
  the next full hour, and the success screen says whether the job is live.
- **Worker job page:** one pinned action — "I'm interested — call now" records
  interest and opens the dialer in one tap (so every call appears in the
  employer's applicant list); "just show interest" is secondary. Copy/Kakao/
  save/report moved out of the sticky bar.
- **SMS alerts** include a short job link (`/j/<id>`, which routes through
  login and back) and no longer contain emoji (not supported by Korean SMS).
- **Employers get an SMS** for the first 3 interested workers per job, with a
  link to the applicants page (skipped if they turned SMS off).
- Login honors a safe same-origin `?next=` path.

### Added
- Feed pagination (20 per page, "Load more") and a result count.
- ESLint config (`next/core-web-vitals` + `next/typescript`); `npm run lint`
  now runs in CI.
- `vercel.json` registering both cron endpoints.

## [0.2.2-pilot] — 2026-06-24

Full multilingual UI pass. No new features — the entire visible app now renders
in Korean, English, and Uzbek.

### Fixed
- **Admin, public, and legal pages were English-only.** Founder/ops/users/
  user-timeline admin screens, all public pages (how-it-works, pricing), and
  all legal pages (terms, privacy, worker/employer agreements) are now fully
  localized in all three languages.
- **Uzbek "admin fallback" removed.** `i18n:check` now requires Uzbek to mirror
  every Korean key (admin + legal included), not just user-facing ones.
- Localized remaining accessibility labels (menu, notifications, language,
  dialog close) and server-built admin timeline event labels.
- `LegalNotice` now shows in every language (Korean: reference-pending-review;
  English/Uzbek: translation-for-convenience).

### Added
- **`npm run i18n:scan`** — heuristic detector of hardcoded user-visible
  strings (JSX text + visible attributes), with `// i18n-ignore` opt-out and a
  `--ci` mode wired into CI.
- New locale namespaces: `pub` (public pages) and an expanded `legal`
  (terms/privacy/agreements); ~430 new translated keys across ko/en/uz
  (catalogs now 792 keys each, fully mirrored).
- I18N_QA.md expanded with public/worker/employer/admin checklists.

### Notes
- Legal page bodies remain `[Draft]` pending counsel review (translated but
  marked). Brand wordmark stays "WorkNow Korea" in all languages by design.

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
