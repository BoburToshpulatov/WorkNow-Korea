# WorkNow Korea — Deployment Guide

Staging/production deployment for the pilot. Pairs with `PILOT_RUNBOOK.md` (operations)
and `SECURITY_CHECKLIST.md` (security review).

## 1. Recommended staging architecture
- **App:** Vercel (or a Node host) running Next.js 14, `APP_ENV=staging`.
- **DB:** managed Postgres (Neon / Supabase / RDS).
- **Storage:** S3-compatible private bucket (or `local` only if single-instance staging).
- **Rate limiting:** Upstash Redis (recommended even in staging to test it).
- **Monitoring:** Sentry project (staging environment).

## 2. Recommended production architecture
- **App:** Vercel/Node, **multiple instances** behind the platform's load balancer.
- **DB:** managed Postgres with automated backups + PITR.
- **Storage:** S3 / Cloudflare R2 / DO Spaces **private** bucket, public access blocked.
- **Rate limiting:** Upstash Redis (shared across instances — in-memory is per-instance).
- **Monitoring:** Sentry (production environment), uptime monitor on `/api/health`.
- **Cron:** Vercel Cron / GitHub Actions hitting `/api/cron/documents-cleanup`.

## 3. PostgreSQL setup
```bash
createdb worknow_korea            # or provision managed Postgres
# set DATABASE_URL to the managed connection string (sslmode=require in prod)
npx prisma migrate deploy         # apply migrations (never `migrate dev` in prod)
```

## 4. S3 / private bucket setup
1. Create a **private** bucket; enable "Block all public access".
2. Create an IAM user/key with `s3:PutObject/GetObject/DeleteObject/HeadObject` on
   `arn:aws:s3:::<bucket>/<prefix>*` only.
3. Set `UPLOAD_STORAGE=s3` + `AWS_REGION/ACCESS_KEY_ID/SECRET_ACCESS_KEY/S3_BUCKET`
   and `AWS_S3_PRIVATE_PREFIX=verification/`.
4. R2/Spaces: also set `S3_ENDPOINT` and (if required) `S3_FORCE_PATH_STYLE=true`.
5. Verify: `npm run storage:check` (saves/reads/deletes a tiny object; prints no secrets).

## 5. Environment variables
See `.env.example` for the full annotated list. Production requires:
`APP_ENV=production`, https `APP_URL`, real `AUTH_SECRET`, `DATABASE_URL`,
`UPLOAD_STORAGE=s3` (+AWS_*), `RATE_LIMIT_PROVIDER=redis` (+UPSTASH_*),
`ENABLE_ERROR_MONITORING=true`+`SENTRY_DSN`, `CRON_SECRET`.
Startup (`src/instrumentation.ts` → `validateEnv`) **fails the boot** on unsafe prod config.

## 6. Migrations
```bash
npx prisma migrate deploy   # idempotent; run on every deploy before traffic
npx prisma generate         # part of build
```

## 7. Seed strategy
- **Staging:** `npm run db:seed` for demo data is fine.
- **Production:** do NOT seed demo users. Onboard real employers/workers per the runbook.

## 8. Cron setup (document retention)
**Vercel Cron** (`vercel.json`):
```json
{ "crons": [{ "path": "/api/cron/documents-cleanup", "schedule": "0 3 * * *" }] }
```
Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set.

**GitHub Actions**:
```yaml
on: { schedule: [{ cron: "0 18 * * *" }] }   # 03:00 KST
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -X POST "$APP_URL/api/cron/documents-cleanup" -H "Authorization: Bearer $CRON_SECRET"
        env: { APP_URL: ${{ secrets.APP_URL }}, CRON_SECRET: ${{ secrets.CRON_SECRET }} }
```
**Manual:** `npm run documents:cleanup`.

## 9. Monitoring setup
- Set `ENABLE_ERROR_MONITORING=true` + `SENTRY_DSN`. Errors are captured server-side
  with sensitive fields scrubbed (see `src/lib/error-monitoring.ts`).
- Point an uptime monitor at `GET /api/health` (200 healthy, 503 degraded).

## 10. Rate limiting setup
- Set `RATE_LIMIT_PROVIDER=redis` + `UPSTASH_REDIS_REST_URL/TOKEN`.
- Verify: `npm run rate-limit:check`. In production, `memory` triggers a startup warning.

## 11. Security checklist
See `SECURITY_CHECKLIST.md`. Highlights: private documents, admin-only download,
redacted logs/Sentry, rate-limited write routes, secret-protected cron, admin-only CSV.

## 12. Rollback checklist
- [ ] Roll the app back to the previous deploy (Vercel: promote prior deployment).
- [ ] If a migration caused it, restore DB from the latest backup / apply a down migration.
- [ ] Confirm `/api/health` is green and `npm run storage:check` passes.
- [ ] Re-run `npx prisma migrate status` to confirm schema state.
- [ ] Announce status; check Sentry for the triggering error.
```
