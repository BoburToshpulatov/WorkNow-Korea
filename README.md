# WorkNow Korea

A mobile-first **job information platform** connecting employers and workers directly for on-demand, short-term, and daily labor across Korea.

> **Legal positioning:** WorkNow Korea is a job information platform. Employers and workers contact each other directly. We do **not** employ, dispatch, or supervise workers, and we make **no guarantee** of hiring, salary, or employment.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma + PostgreSQL**, and **Auth.js (NextAuth v5)**.

---

## Prerequisites

- **Node.js 18+**
- **PostgreSQL** running locally (or a hosted connection string)

## Setup

1. **Install dependencies** (already done in this scaffold):

   ```bash
   npm install
   ```

2. **Configure environment** — copy the example and fill in values:

   ```bash
   cp .env.example .env
   ```

   | Variable          | Description                                            |
   | ----------------- | ------------------------------------------------------ |
   | `DATABASE_URL`    | PostgreSQL connection string                           |
   | `NEXTAUTH_SECRET` | Random secret for session signing                      |
   | `NEXTAUTH_URL`    | App URL, e.g. `http://localhost:3000`                  |
   | `AUTH_SECRET`     | Auth.js v5 secret — set to the same value as the above |

   Generate a secret with: `openssl rand -base64 32`

3. **Create the database**:

   ```bash
   createdb worknow_korea
   ```

4. **Run migrations** (creates tables):

   ```bash
   npx prisma migrate dev
   ```

5. **Seed demo data**:

   ```bash
   npm run db:seed
   ```

6. **Start the dev server**:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000

## Useful scripts

| Script                | Action                               |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Start the dev server                 |
| `npm run build`       | Production build                     |
| `npm run db:generate` | Regenerate the Prisma client         |
| `npm run db:migrate`  | Create/apply a dev migration         |
| `npm run db:reset`    | Drop, re-migrate, and re-seed the DB |
| `npm run db:seed`     | Seed demo users, jobs, and plans     |
| `npm run db:check-users` | List users (phone, role, hash yes/no) — never prints secrets |
| `npm run typecheck`   | Type-check with `tsc --noEmit`       |

## Demo credentials

| Role     | Phone           | Password      |
| -------- | --------------- | ------------- |
| Admin    | `010-0000-0000` | `admin123`    |
| Employer | `010-1111-1111` | `password123` |
| Worker   | `010-4444-0001` | `password123` |

## Local Login Setup

If login shows **"Invalid phone number or password,"** the cause is almost always
that the app cannot reach the database, so it was never migrated/seeded and there
are no users to authenticate against. Work through these steps in order:

1. **Make sure PostgreSQL is running and you know the credentials.**

   This project was configured against a local Homebrew PostgreSQL 16 instance
   that uses **trust auth** (no password) with your macOS user as the superuser.
   Because another Postgres was already holding port `5432`, the Homebrew instance
   runs on **port 5433**. Start it with:

   ```bash
   export LC_ALL=en_US.UTF-8   # avoids the macOS "postmaster became multithreaded" error
   pg_ctl -D /opt/homebrew/var/postgresql@16 -l /opt/homebrew/var/postgresql@16/server.log start
   pg_isready -h localhost -p 5433   # should say "accepting connections"
   ```

   If your Postgres uses a different port/user/password, set `DATABASE_URL`
   accordingly instead.

2. **Point `DATABASE_URL` at the running database** (in `.env`). For the trust-auth
   Homebrew setup above (replace `youruser` with your macOS username):

   ```
   DATABASE_URL="postgresql://youruser@localhost:5433/worknow_korea?schema=public"
   ```

3. **Set the auth secret.** `AUTH_SECRET` (and `NEXTAUTH_SECRET`) must be a real
   non-empty value, or Auth.js v5 throws a `Configuration` error on login:

   ```bash
   openssl rand -base64 32   # paste into both AUTH_SECRET and NEXTAUTH_SECRET
   ```

4. **Create the DB, migrate, and seed:**

   ```bash
   createdb -h localhost -p 5433 worknow_korea   # if it doesn't exist yet
   npx prisma migrate dev
   npm run db:seed
   ```

5. **Verify the users exist** (should list 9 users, all `HASH? = yes`):

   ```bash
   npm run db:check-users
   ```

6. **Start the app and log in:**

   ```bash
   npm run dev   # serves on http://localhost:3000
   ```

   > If you see `Port 3000 is in use, trying 3001 instead`, a stale dev server is
   > still running. Stop it so the port matches `NEXTAUTH_URL`:
   > `lsof -ti :3000 | xargs kill`

(Three employers `010-1111…3333` and five workers `010-4444-0001…0005` are seeded.)

## What's implemented

- **Auth** — phone + password credentials login/registration, role-based sessions (Worker / Employer / Admin), bcrypt hashing.
- **Worker** — profile, job feed with filters (urgent / same-day pay / night / category / city / salary / language), job detail with big salary, save & "I'm interested", saved/interested lists, notification preferences.
- **Employer** — business profile, post/edit/cancel jobs (sectioned form + zod), my-jobs list with status, applicant list (masked phone).
- **Admin** — dashboard stats, user table with role filter, job moderation (approve/reject/flag), reports view.
- **APIs** — auth- and role-guarded routes for jobs, interests, saves, profiles, notifications, admin moderation; zod validation on all inputs; in-memory rate-limit placeholder.
- **Design system** — shadcn-style CSS variables, orange primary (`24 95% 53%`), hand-built UI primitives, mobile sticky header + fixed bottom nav, urgent jobs get a red border and pulsing badge.
- **Legal** — disclaimer on every page (footer) and on job detail; terms / privacy / worker & employer agreements; safety page.
- **Seed** — 1 admin, 3 employers, 5 multilingual workers, 15 varied jobs, interests, saves, notification prefs, 4 subscription plans.

## What's TODO

- **Live SMS vendor keys** — provider architecture is real (Solapi/Coolsms HMAC);
  sends are MOCKED until vendor keys are added (`NOTIFICATION_PROVIDER=sms`).
- Real **push notifications** (Firebase Cloud Messaging).
- **Kakao / Naver Maps** integration (job detail shows a map placeholder).
- **PostGIS** radius search (`getJobsWithinRadius` is a stub; matching falls back to city).
- **Payments** (`SubscriptionPlan` / `Payment` models exist; no checkout flow yet).

## Next features

- Real-time chat between employers and workers
- Saved searches & smart job recommendations
- Worker availability calendar & shift scheduling

## Pilot QA Checklist

Language: use the switcher in the header (한국어 / English). Selection is stored in
the `worknow_locale` cookie and persists across refresh; missing keys fall back to Korean.

### Worker
- [ ] Register (phone + password) and land on profile
- [ ] Switch language (KO ↔ EN) and confirm it persists after refresh
- [ ] See the job feed immediately (no forced profile completion)
- [ ] Filter jobs (All / Urgent / Same-day pay / Night, category, region, salary, language)
- [ ] Open a job detail
- [ ] Tap "I'm interested" and see the confirmation
- [ ] Call / copy number / copy KakaoTalk ID
- [ ] See notifications in the inbox (Alerts page) and mark read

### Employer
- [ ] Register and complete business profile (사업자등록번호 → verification PENDING)
- [ ] Post a detailed job
- [ ] Repost a previous job (Repost button → prefilled form)
- [ ] See applicants, call/copy worker contact
- [ ] Update applicant status (Interested → Contacted → Hired → Completed/No-show)
- [ ] See "new interest" notifications in the dashboard inbox

### Admin (010-0000-0000 / admin123)
- [ ] Approve / reject / flag jobs (approving an urgent job fans out alerts)
- [ ] Verify employers/workers (dropdown in Users)
- [ ] See reports
- [ ] See pilot stats + moderation queue

## Notification Pilot Test

End-to-end test of the core marketplace loop (Korean or English — switch via the
header). Mock provider is fine; in-app notifications are real.

1. Log in as **employer** (`010-1111-1111` / `password123`).
2. Tap **빠른 일자리 등록 / Quick Post** → create an **urgent** job in **대구광역시 / 달서구**
   (e.g. category Cleaning, daily ₩130,000, 3 workers). Submit → success screen.
3. Log in as **admin** (`010-0000-0000` / `admin123`) → **공고 관리 / Jobs** → **Approve**
   the new job (this flips it to OPEN and fans out alerts to matching workers).
4. Log in as a **matching worker** (`010-4444-0001` / `password123` — Daegu 달서구, cleaning).
5. Confirm a **job-alert notification** appears in the inbox (Alerts page).
6. Confirm the **unread badge** shows on the header bell and bottom-nav Alerts.
7. **Click the notification** → it opens the job detail.
8. Review salary / location / contact.
9. Tap **관심 있음 / I'm interested**.
10. Log back in as the **employer**.
11. Confirm the employer receives a **new-applicant notification** (dashboard inbox + badge).
12. Open the job's **applicants** page → mark the worker **Contacted → Hired**.

Verify delivery logs as admin: **관리 → 알림 모니터링 / Admin → Notification monitoring**
(filter by failed / mocked / sent / job alerts / employer alerts).

Automated matching check: `npm run test:matching` (asserts district/language/urgent gates).

### Enabling a real SMS/Kakao provider later
Set `NOTIFICATION_PROVIDER=sms` (or `kakao`) and the matching `*_KEY/_SECRET/_SENDER`
env vars. Without keys the provider safely degrades to `MOCKED` and logs rows in
Notification monitoring — job creation never breaks.

## Trust & Safety Pilot Test

Verification, trust badges, reporting, and applicant lifecycle. Korean or English
(switch in the header). Demo logins as in "Demo credentials".

### Employer
1. Log in as employer → **Profile**. See the verification status banner + why it matters.
2. Fill representative name, business address, 사업자등록번호 → **Submit for verification** (status → 검토 중 / Under review).
3. Log in as **admin** → **인증 검토 / Verification review** → open the employer card → **Approve** (optionally add an internal note).
4. Employer receives a notification; the **Verified** badge now appears on their jobs and job detail.
5. Post a job (quick or full); receive applicants.
6. On the applicants page, move a worker **Hired** (capped at workersNeeded), then **Completed** / **No-show**.

### Worker
1. Log in as worker → **Profile**. See the verification status + eligibility disclaimer.
2. Enter nationality + visa/eligibility category → save (status → Under review).
3. Admin → **Verification review** → **Workers** tab → Approve / Reject / Request more info (+ note).
4. Worker receives a status notification.
5. Apply to a job ("I'm interested"); open **My Applications** to see status, salary, start time, contact buttons.
6. When the employer changes status, the worker gets a notification and sees it in My Applications.

### Admin
- **Verification review** — approve/reject/needs-info for employers & workers, with internal notes.
- **Reports** — filter by reason & status; change status (OPEN → REVIEWING → RESOLVED/DISMISSED); add admin note; open the related job. An employer with 3+ open reports is auto-flagged (NEEDS_REVIEW) and shows a "Needs review" trust badge.
- **Notification monitoring** — inspect mocked/sent/failed deliveries.

> Verification is manual (admin reviews submitted info). Real 사업자등록번호 registry
> lookup and document upload are TODO — see comments in the profile API routes.

## ⚠️ Document storage — security & privacy

- **Local file storage is for development only.** Verification documents are written to
  `/uploads/verification` (outside the public dir, git-ignored, file mode `0600`).
- **Production must use a private S3 / Cloudinary bucket** with **short-lived signed URLs**
  (no public objects). Never serve documents statically.
- Documents are **admin-only**: the download route streams bytes only to `ADMIN`; owners
  see metadata only; nothing is exposed on job cards or public pages.
- Uploads are allow-listed (jpg/png/pdf, ≤5MB), stored under random names; the user's
  original filename is metadata only (never used on disk).
- A **PIPA / privacy review is required before real launch.** Minimize collection — the UI
  warns users to upload only what verification requires.

## Document Verification & Reviews Pilot Test

### Employer
1. Log in as employer → **Profile** → fill business fields + 사업자등록번호.
2. In **Verification documents**, choose *Business registration*, upload a jpg/png/pdf → status becomes **Pending**; profile enters the verification queue.
3. Log in as **admin** → **Document review** → open the file (admin-only), **Approve** / **Reject** (+ note).
4. Admin → **Verification review** → Approve the employer → **Verified** badge appears on their jobs.
5. Post a job, receive an applicant, mark them **Hired** → **Completed**.
6. On the applicants page, leave a **review** (1–5 stars) for the completed worker.

### Worker
1. Log in as worker → **Profile** → nationality + visa category (note the eligibility disclaimer).
2. Upload an optional ID/visa document (privacy warning shown) → status **Pending**.
3. Admin approves the document + worker verification → **Verified** badge on the applicant card.
4. Apply to a job; after the employer marks you **Completed**, open **My Applications** and **review the employer**.

### Admin
1. **Document review** — open/approve/reject documents (only admins can open files).
2. **Audit trail** — `AdminAuditLog` records uploads, reviews, rejections, revocations.
3. **Trust dashboard** — pending verifications, pending/rejected documents, employers needing review, platform avg rating, failed notifications, open reports — each links to its queue.
4. Confirm a document URL (`/api/verification/documents/<id>`) returns **403** for non-admins and is **never** linked publicly.

> Reviews are allowed only after `COMPLETED`, one per reviewer per job per reviewee.
> Average rating feeds the **Reliable** trust tier (verified + completed + avg ≥ 4).

## Deployment checklist (production)

Production refuses to boot with unsafe defaults (see `src/lib/env.ts` + `instrumentation.ts`).

- [ ] `APP_ENV=production`
- [ ] `APP_URL=https://…` (real https, not localhost)
- [ ] `AUTH_SECRET` / `NEXTAUTH_SECRET` = real random value (`openssl rand -base64 32`)
- [ ] `DATABASE_URL` → managed Postgres (not the local trust-auth instance)
- [ ] `UPLOAD_STORAGE=s3` + `AWS_REGION/ACCESS_KEY/SECRET/S3_BUCKET/S3_PRIVATE_PREFIX`
      (private bucket, no public objects; implement `S3StorageProvider` + signed URLs)
- [ ] `ENABLE_ERROR_MONITORING=true` + `SENTRY_DSN` (wire Sentry in `error-monitoring.ts`)
- [ ] `NOTIFICATION_PROVIDER=sms|kakao` + provider keys (or stay `mock` deliberately)
- [ ] Replace in-memory rate limiter with Redis/Upstash (see `rate-limit.ts` TODO)
- [ ] Schedule `npm run documents:cleanup` (cron) for retention
- [ ] **PIPA / privacy review by Korean counsel** before storing real documents/PII

Validate config locally: set the vars and run `npm run build` — startup logs env warnings;
production-fatal misconfig throws at boot.

## Error Monitoring Setup
The app runs fine without monitoring (errors go to the redacting logger). To enable Sentry:
1. Create a Sentry project, copy the DSN.
2. Set `ENABLE_ERROR_MONITORING=true` and `SENTRY_DSN=...`.
3. `@sentry/node` is already installed; `src/lib/error-monitoring.ts` initializes it lazily and
   scrubs sensitive fields (password, phone, BRN, filenames, secrets) before sending.
Captured operations include job/quick-post creation, notification sending, document upload/download,
review creation, report creation, and admin verification actions.

## Rate Limiting Setup
- Dev: `RATE_LIMIT_PROVIDER=memory` (in-process; resets per instance).
- Production: `RATE_LIMIT_PROVIDER=redis` + `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
  (Upstash Redis REST — shared across instances). In-memory in production triggers a startup warning.
- Verify: `npm run rate-limit:check`. Protected routes: login, register, quick/detailed job creation,
  interest, report, document upload, review.

## Scheduled Document Cleanup
- Endpoint: `POST /api/cron/documents-cleanup` (also accepts GET), protected by `CRON_SECRET`
  (`Authorization: Bearer <secret>` or `?secret=`).
- Manual: `npm run documents:cleanup`. Vercel Cron / GitHub Actions examples in `DEPLOYMENT.md`.
- Removes rejected (>`REJECTED_DOCUMENT_RETENTION_DAYS`) and approved/expired
  (>`DOCUMENT_RETENTION_DAYS`) files; soft-deletes rows + writes an audit entry.

## Health Check
`GET /api/health` → app/db status, app env, notification provider, upload storage,
rate-limit provider, error-monitoring flag, timestamp. No secrets. 200 healthy / 503 degraded.

## Worker SMS + Uzbek Pilot Test
1. Register a worker; in the header switch language to **O‘zbekcha** (or pick at signup → saved to `preferredLocale`).
2. Worker profile/notifications: set district + category + languages.
3. Notification settings: turn **SMS alerts ON** (records consent timestamp; shows fee/opt-out notice).
4. As an employer, create an **urgent** matching job (same district/category).
5. As admin, **approve** the job (→ OPEN, fans out alerts).
6. Worker receives an **in-app notification**; an **SMS delivery log** appears in **Admin → Ops → SMS delivery logs** (SENT with real keys, MOCKED otherwise).
7. Worker opens job detail in Uzbek; taps **Qiziqaman** (interested).
8. Employer receives a "new applicant" notification.
9. Worker turns **SMS alerts OFF** → consent cleared, no further SMS.

**Real SMS:** set `NOTIFICATION_PROVIDER=sms`, `SMS_PROVIDER=solapi` (Solapi/Coolsms),
`SMS_PROVIDER_KEY/SECRET`, `SMS_SENDER_PHONE`. Missing keys → MOCKED in dev; in production,
startup validation fails if `NOTIFICATION_PROVIDER=sms` and SMS env is incomplete.
Founder test: **Admin → Ops → Test SMS** sends one message and shows the delivery status.

## Development Workflow

Branch model:

| Branch      | Purpose                                  |
| ----------- | ---------------------------------------- |
| `main`      | Stable, deployable. Protected.           |
| `staging`   | Pre-production testing / staging deploy. |
| `feature/*` | New work, branched off `main`.           |

```bash
git checkout main && git pull
git checkout -b feature/my-change
# ...edit...
npm run secrets:check && npm run typecheck && npm run build
git add . && git commit -m "feat: my change"
git push -u origin feature/my-change   # open a PR into main
```

CI (`.github/workflows/ci.yml`, Node 22) runs on every PR: `npm ci` →
`prisma generate` → `secrets:check` → `typecheck` → `build`. All must pass.

See `CONTRIBUTING.md`, `STAGING_DEPLOYMENT_PLAN.md`, `RELEASE_CHECKLIST.md`,
and `CHANGELOG.md`. Never commit secrets — `.env` is gitignored; only
`.env.example` is tracked.
