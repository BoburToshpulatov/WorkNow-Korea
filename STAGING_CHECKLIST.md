# WorkNow Korea — Staging Checklist

Every item is verifiable. Run before inviting any real users. Pairs with
`DEPLOYMENT.md`, `SECURITY_CHECKLIST.md`, `PILOT_INCIDENTS.md`.

## Database
- [ ] Managed Postgres provisioned; `DATABASE_URL` set (`sslmode=require`).
- [ ] `npx prisma migrate status` → "Database schema is up to date!"
- [ ] `npm run db:check-users` lists expected accounts.

## Storage
- [ ] `UPLOAD_STORAGE` set (`local` staging-only, or `s3`).
- [ ] `npm run storage:check` → ✅ (save/read/delete; no public URL).
- [ ] Bucket has "Block public access" enabled (S3 mode).

## Monitoring
- [ ] `ENABLE_ERROR_MONITORING=true` + `SENTRY_DSN` (staging project).
- [ ] Trigger a test error → appears in Sentry with sensitive fields scrubbed.
- [ ] Uptime monitor on `GET /api/health` (expects 200).

## Notifications
- [ ] `NOTIFICATION_PROVIDER` set (mock acceptable in staging).
- [ ] Post→approve a job → matching worker gets an in-app alert (`/admin/notifications` SENT).
- [ ] `/admin/ops` "Resend failed notifications" works.

## Verification
- [ ] Worker submits visa category + uploads doc → status PENDING.
- [ ] Employer submits BRN + uploads doc → status PENDING.
- [ ] Admin approves in `/admin/verifications` + `/admin/documents` → badges update.
- [ ] Document download: anon 401 / other user 403 / owner metadata / admin file.

## Admin
- [ ] Admin login works; non-admins cannot reach `/admin/*` or admin APIs.
- [ ] `/admin/founder` loads with live KPIs.
- [ ] `/admin/users` search by phone/name works; user timeline opens.
- [ ] Force-verify (VerifyControl) works on users + timeline pages.

## Analytics
- [ ] `/admin/analytics` funnel + top districts/categories render (7/30/all).
- [ ] `/admin/founder` conversion rates compute.

## Rate limiting
- [ ] `RATE_LIMIT_PROVIDER` set (`redis` recommended) + Upstash keys if redis.
- [ ] `npm run rate-limit:check` → ✅.
- [ ] Rapid repeated writes return 429.

## Cron
- [ ] `CRON_SECRET` set.
- [ ] `POST /api/cron/documents-cleanup` → 401 without secret, 200 with secret.
- [ ] Scheduler (Vercel Cron / GitHub Actions) configured per `DEPLOYMENT.md`.

## Backups
- [ ] Automated Postgres backups + PITR enabled; restore drill done once.
- [ ] Document retention verified: `npm run documents:cleanup` runs and audits.
- [ ] CSV exports work (`/admin/ops`): users / jobs / interests / reports / verifications.

## Final
- [ ] `npm run typecheck` → 0 errors.
- [ ] `npm run build` → success.
- [ ] Korean ↔ English switch persists across refresh.
- [ ] Demo/seed data removed from production (staging may keep it).
