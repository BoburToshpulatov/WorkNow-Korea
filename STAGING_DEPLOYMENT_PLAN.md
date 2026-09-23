# Staging Deployment Plan — WorkNow Korea

Step-by-step setup of a **staging** environment that mirrors production, for
pre-pilot testing on real phones. The repo side is ready; everything below is
account setup you do once. Budget ~2 hours, plus a few days' wait for SMS
sender-number approval (start step 7 first).

See `DEPLOYMENT.md` for production details and `RELEASE_CHECKLIST.md` for the
per-release procedure.

---

## 0. Stack and why

| Concern        | Service                          | Region             | Why |
| -------------- | -------------------------------- | ------------------ | --- |
| App            | **Vercel** (separate staging project) | `icn1` Seoul (set in `vercel.json`) | Native Next.js 14 |
| Postgres       | **Supabase**                     | Northeast Asia (Seoul) | Keeps personal data in Korea (PIPA) and next to the app |
| Documents      | **AWS S3**, private bucket       | `ap-northeast-2` Seoul | ID / business documents stay in Korea |
| Rate limiting  | **Upstash Redis**                | closest to Seoul   | Stores only rate-limit counters |
| Errors         | **Sentry**                       | —                  | Scrubbed server errors |
| SMS            | **Solapi**                       | —                  | Korean sender-number support |
| Crons          | Vercel Cron (daily) + GitHub Actions (hourly) | — | Works on the Hobby plan |

Alternatives work too (Neon for Postgres, Cloudflare R2 for storage — set
`S3_ENDPOINT`), but they host data outside Korea; confirm with counsel first.

Staging must use **separate** databases, buckets, and keys from production.

Keep a scratch note of the values marked **→ note** below — they become the
environment variables in step 6.

---

## 1. GitHub

1. Merge `feature/pilot-ready-marketplace` into `main` (via PR), then create the
   `staging` branch from `main`:
   ```bash
   git switch main && git pull && git switch -c staging && git push -u origin staging
   ```
2. Generate the shared secrets now (**→ note** both):
   ```bash
   openssl rand -base64 32   # AUTH_SECRET
   openssl rand -hex 32      # CRON_SECRET
   ```

## 2. Supabase (Postgres)

1. New project → name `worknow-staging` → region **Northeast Asia (Seoul)** →
   set a strong DB password (**→ note**).
2. Project → **Connect** → **ORMs → Prisma**. Copy both strings (**→ note**):
   - **Transaction pooler** (port `6543`, ends with `?pgbouncer=true`) → `DATABASE_URL`
   - **Session pooler** (port `5432`) → `DIRECT_URL`

   Use the session pooler, not the "direct connection", for `DIRECT_URL`:
   the direct host is IPv6-only and Vercel builds can't reach it.

## 3. AWS S3 (verification documents)

1. S3 → Create bucket `worknow-staging-docs`, region **ap-northeast-2**.
   Keep **Block all public access** ON. Default encryption (SSE-S3) ON.
2. IAM → Users → create `worknow-staging-app` (no console access) with this
   inline policy — least privilege, this bucket only:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
       "Resource": "arn:aws:s3:::worknow-staging-docs/*"
     }]
   }
   ```
3. Create an access key for that user (use case: "Application running outside
   AWS") → **→ note** access key ID + secret.

## 4. Upstash Redis (rate limiting)

1. Create database → name `worknow-staging` → region closest to Seoul (Tokyo).
2. **REST API** section → **→ note** `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

## 5. Sentry (errors)

1. Create project → platform **Node.js** → name `worknow-staging`.
2. **→ note** the DSN.

## 6. Vercel

1. **Add New → Project** → import the GitHub repo → name it **`worknow-staging`**.
2. Before the first deploy, set:
   - **Build Command**: `npm run build:deploy` (applies migrations, then builds)
   - **Node.js Version**: 22.x (also pinned via `engines`)
3. **Environment Variables** (Production environment of this project):

   | Variable | Value |
   | --- | --- |
   | `APP_ENV` | `staging` |
   | `APP_URL` | `https://worknow-staging.vercel.app` (or your custom domain) |
   | `NEXTAUTH_URL` | same as `APP_URL` |
   | `AUTH_SECRET` | from step 1 |
   | `NEXTAUTH_SECRET` | same as `AUTH_SECRET` |
   | `DATABASE_URL` | Supabase transaction pooler (step 2) |
   | `DIRECT_URL` | Supabase session pooler (step 2) |
   | `UPLOAD_STORAGE` | `s3` |
   | `AWS_REGION` | `ap-northeast-2` |
   | `AWS_S3_BUCKET` | `worknow-staging-docs` |
   | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | step 3 |
   | `AWS_S3_PRIVATE_PREFIX` | `verification/` |
   | `RATE_LIMIT_PROVIDER` | `redis` |
   | `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | step 4 |
   | `ENABLE_ERROR_MONITORING` | `true` |
   | `SENTRY_DSN` | step 5 |
   | `CRON_SECRET` | from step 1 |
   | `NOTIFICATION_PROVIDER` | `mock` until step 7 is done, then `sms` |
   | `SMS_PROVIDER` | `solapi` |
   | `DOCUMENT_RETENTION_DAYS` / `REJECTED_DOCUMENT_RETENTION_DAYS` | `90` / `14` |
   | `LOG_LEVEL` | `info` |

4. **Settings → Git → Production Branch** = `staging`. (Vercel Cron only runs
   on production deployments of a project, so this makes the daily crons run.)
5. Deploy. The app **refuses to boot** if any required variable is missing or
   unsafe — the error in the function logs lists exactly which.

### Verify the config locally (optional but fast)
```bash
npx vercel link            # pick worknow-staging
npx vercel env pull .env.staging --environment=production
npm run env:check -- .env.staging
```
`.env.staging` is gitignored. Delete it when done.

## 7. Solapi (SMS) — start this first, approval takes days

1. Sign up at solapi.com as a business.
2. **발신번호 등록** (sender number registration). Required by Korean law; a
   business landline/mobile needs 통신서비스 이용증명원. Wait for approval.
3. Create an API key → **→ note** key + secret.
4. In Vercel add `SMS_PROVIDER_KEY`, `SMS_PROVIDER_SECRET`,
   `SMS_SENDER_PHONE` (the approved number, digits only), then set
   `NOTIFICATION_PROVIDER=sms` and redeploy.
5. **Admin → Ops → Test SMS** to your own phone.

Until then, sends are logged as `MOCKED` in **Admin → Notification monitoring**.

## 8. Seed demo data (staging only)

The seed **deletes all data**. It refuses to run on production, and on staging
only with an explicit opt-in:
```bash
APP_ENV=staging ALLOW_STAGING_SEED=true \
  DATABASE_URL="<session pooler URL>" DIRECT_URL="<session pooler URL>" \
  npm run db:seed
```
Then log in as admin (`010-0000-0000`) and **change the demo passwords** if the
staging URL will be shared outside the team.

## 9. Hourly crons (GitHub Actions)

Repo → **Settings → Secrets and variables → Actions** → add:
- `STAGING_APP_URL` = the `APP_URL` above
- `STAGING_CRON_SECRET` = the `CRON_SECRET` above

`.github/workflows/cron.yml` then expires stale jobs hourly (run it once via
**Actions → Scheduled jobs → Run workflow** to confirm).

## 10. Smoke test

```bash
CRON_SECRET="<staging cron secret>" npm run smoke -- https://worknow-staging.vercel.app
```
Checks health (DB, S3, redis, commit), pages, the SMS short link, and that cron
and verification documents are locked down. Then walk the manual checklist:

- [ ] Amber "test server" banner shows; page source has `noindex`
- [ ] Register + login (worker, employer, admin); KO / EN / UZ switch persists
- [ ] Verified employer quick-posts → job is live immediately
- [ ] Matching worker gets in-app alert (+ SMS once step 7 is done) with a working `/j/…` link
- [ ] Worker taps "I'm interested — call now" → employer sees applicant + gets SMS
- [ ] Unverified employer's job lands in Admin → Jobs as PENDING
- [ ] Upload a phone photo (>4MB is fine — it's shrunk) → admin can open it
- [ ] Trigger an error → it appears in Sentry

---

## Migration strategy

- **Never** run `migrate dev` against staging/production.
- `npm run build:deploy` runs `prisma migrate deploy` (idempotent) before each build.
- Before a risky migration: Supabase → Database → Backups (or a manual
  `pg_dump` via the session pooler).

## Rollback plan

- **App:** Vercel → Deployments → promote the previous green deployment.
- **DB:** forward-only migrations; restore the pre-deploy backup if needed.
- **Config:** revert the changed env vars and redeploy.
- Log it in `PILOT_INCIDENTS.md` and tell the pilot channel.
