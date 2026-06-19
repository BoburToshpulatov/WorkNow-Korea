# Release Checklist — WorkNow Korea

Use this for every release to staging or production. Tag releases as
`v<version>` (see `CHANGELOG.md`). Current: `0.1.0-pilot`.

## Pre-release checks
- [ ] On the correct branch (`staging` for staging, `main` for production)
- [ ] `git status` clean, latest changes pulled
- [ ] `npm ci` installs cleanly
- [ ] `npm run secrets:check` ✅
- [ ] `npm run typecheck` ✅
- [ ] `npm run build` ✅
- [ ] `npm run test:matching` ✅
- [ ] `npm run storage:check` ✅
- [ ] `npm run rate-limit:check` ✅
- [ ] CHANGELOG updated; version bumped in `package.json`

## Migration checks
- [ ] New migrations reviewed
- [ ] DB snapshot/backup taken (production)
- [ ] `npx prisma migrate deploy` planned as a deploy step (never `migrate dev`)
- [ ] Migration is backward-compatible or has a rollback plan

## Environment checks
- [ ] All required env vars set for the target (see STAGING_DEPLOYMENT_PLAN §9)
- [ ] `APP_ENV` correct (`staging` / `production`)
- [ ] Production: `UPLOAD_STORAGE=s3`, https `APP_URL`, non-placeholder secrets
- [ ] If `NOTIFICATION_PROVIDER=sms`, all SMS env vars present (startup validates)

## Deploy
- [ ] Deploy the green build
- [ ] Run `prisma migrate deploy`
- [ ] (staging only) `npm run db:seed` if needed

## Post-deploy checks
- [ ] `GET /api/health` → 200
- [ ] Login works (worker / employer / admin)
- [ ] Job post → approve → notification + SMS log
- [ ] Admin → Ops → Test SMS works
- [ ] Errors reaching Sentry
- [ ] No error spike in logs for 15 min

## Emergency rollback
1. Vercel → Deployments → **promote previous** green deployment.
2. If a migration broke things: restore the DB snapshot taken pre-deploy.
3. Revert offending env var changes.
4. Open a Pilot incident issue; record in `PILOT_INCIDENTS.md`.
5. Announce status in the pilot channel.
