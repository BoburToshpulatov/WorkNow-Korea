# Staging Deployment Plan — WorkNow Korea

This is the step-by-step plan to stand up a **staging** environment that mirrors
production, for pre-pilot testing. See `DEPLOYMENT.md` for production details and
`RELEASE_CHECKLIST.md` for the release procedure.

---

## 1. Recommended hosting

| Concern         | Recommendation                                  |
| --------------- | ----------------------------------------------- |
| App (Next.js)   | **Vercel** (native Next.js 14 App Router)       |
| Postgres        | **Neon** or **Supabase** (managed, branchable)  |
| Object storage  | **Cloudflare R2** or **AWS S3** (private)       |
| Rate limiting   | **Upstash Redis** (REST)                        |
| Errors          | **Sentry**                                      |
| SMS             | **Solapi / Coolsms** (Korean sender ID)         |
| Cron            | **Vercel Cron** (or GitHub Actions schedule)    |

Staging should use **separate** databases, buckets, and keys from production.

## 2. Vercel setup

1. Import the GitHub repo into Vercel.
2. Create a **staging** project (or a Preview env) bound to the `staging` branch.
3. Framework preset: Next.js. Build command `npm run build`, install `npm ci`.
4. Node version: **22**.
5. Add all environment variables (see §9).

## 3. Managed Postgres

1. Create a `worknow_staging` database.
2. Copy the connection string into `DATABASE_URL` (with `?sslmode=require`).
3. Ensure the staging DB is isolated from production.

## 4. S3 / R2 private bucket

1. Create a **private** bucket `worknow-staging-docs`.
2. Block all public access.
3. Create a scoped access key (read/write to that bucket only).
4. Set `UPLOAD_STORAGE=s3`, `AWS_*` / `S3_ENDPOINT` vars.

## 5. Upstash setup

1. Create a Redis database.
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. Set `RATE_LIMIT_PROVIDER=redis`.

## 6. Sentry setup

1. Create a project; copy the DSN.
2. Set `ENABLE_ERROR_MONITORING=true`, `SENTRY_DSN=...`.

## 7. SMS provider setup

1. Register a Solapi/Coolsms account and an approved **sender phone number**.
2. Set `NOTIFICATION_PROVIDER=sms`, `SMS_PROVIDER=solapi`,
   `SMS_PROVIDER_KEY`, `SMS_PROVIDER_SECRET`, `SMS_SENDER_PHONE`.
3. Leave keys blank in early staging → sends degrade to `MOCKED` safely.
4. Verify via **Admin → Ops → Test SMS**.

## 8. Cron setup

1. Schedule `GET /api/cron/documents-cleanup` daily.
2. Protect it with `CRON_SECRET` (header/secret check).
3. On Vercel Cron, add the path; on GitHub Actions, use a scheduled workflow
   that curls the endpoint with the secret.

## 9. Environment variables checklist

| Variable                     | Required | Notes                                   |
| ---------------------------- | -------- | --------------------------------------- |
| `DATABASE_URL`               | ✅       | staging DB, `sslmode=require`           |
| `NEXTAUTH_SECRET`/`AUTH_SECRET` | ✅    | `openssl rand -base64 32`               |
| `NEXTAUTH_URL` / `APP_URL`   | ✅       | https staging URL                       |
| `APP_ENV`                    | ✅       | `staging`                               |
| `NOTIFICATION_PROVIDER`      | ✅       | `mock` early, `sms` once keys ready     |
| `SMS_PROVIDER`               | ⬜       | `solapi`                                |
| `SMS_PROVIDER_KEY/SECRET`    | ⬜       | blank → MOCKED                          |
| `SMS_SENDER_PHONE`           | ⬜       | approved sender                         |
| `UPLOAD_STORAGE`             | ✅       | `s3`                                    |
| `AWS_*` / `S3_ENDPOINT`      | ✅       | private bucket creds                    |
| `RATE_LIMIT_PROVIDER`        | ✅       | `redis`                                 |
| `UPSTASH_REDIS_REST_*`       | ✅       | from Upstash                            |
| `ENABLE_ERROR_MONITORING`    | ⬜       | `true` for staging                      |
| `SENTRY_DSN`                 | ⬜       | from Sentry                             |
| `CRON_SECRET`                | ✅       | random, for cleanup endpoint            |

## 10. Migration strategy

- **Never** run `migrate dev` against staging/production.
- Apply with: `npx prisma migrate deploy` (idempotent, non-interactive).
- Run as a deploy step or one-off job before traffic is allowed.

## 11. Seed strategy

- Staging may seed demo data: `npm run db:seed`.
- **Production is never seeded** with demo users.

## 12. Smoke test checklist (post-deploy)

- [ ] `GET /api/health` returns 200
- [ ] Register + login (worker, employer, admin)
- [ ] Switch language KO / EN / UZ; persists
- [ ] Job feed loads; filters work
- [ ] Employer posts job → admin approves → worker gets in-app notification
- [ ] SMS log appears in Admin → Ops (MOCKED or SENT)
- [ ] Admin → Ops → Test SMS works
- [ ] Document upload + admin verification works
- [ ] Rate limiting active (redis)
- [ ] Errors flow to Sentry (trigger a test error)

## 13. Rollback plan

- **App:** Vercel → Deployments → promote the previous green deployment.
- **DB:** forward-only migrations. Before a risky migration, take a snapshot
  (Neon branch / managed backup). To roll back, restore the snapshot.
- **Config:** keep the previous env var set documented; revert changed vars.
- Communicate via the pilot channel; log in `PILOT_INCIDENTS.md`.
