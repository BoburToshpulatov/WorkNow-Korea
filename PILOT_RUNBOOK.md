# WorkNow Korea — Pilot Runbook

Practical operator guide for running a controlled pilot (≈100 workers, 20 employers, 1 district).
Demo logins: admin `010-0000-0000/admin123`, employer `010-1111-1111/password123`, worker `010-4444-0001/password123`.

## 1. Start the app (local / staging)
```bash
export LC_ALL=en_US.UTF-8
pg_ctl -D /opt/homebrew/var/postgresql@16 -l /opt/homebrew/var/postgresql@16/server.log start  # if DB down
npx prisma migrate deploy && npx prisma generate
npm run dev        # http://localhost:3000
```
Staging: set `APP_ENV=staging`, real `APP_URL`, keep `UPLOAD_STORAGE=local` only if not production.

## 2. Seed demo data
```bash
npm run db:seed
npm run db:check-users   # confirm users exist
```

## 3. Onboard the first 20 employers
1. Send them the signup link → **회원가입 → 고용주**.
2. Ask them to complete **Profile**: business name, representative, address, 사업자등록번호, and **upload the business registration document**.
3. You (admin) review in **Admin → Document review** and **Verification review** → Approve.
4. Verified employers get the badge on their jobs.

## 4. Onboard the first 100 workers
1. Signup link → **회원가입 → 근로자** (workers can switch to English in the header).
2. Profile: district, languages, availability, nationality + visa category, optional ID upload.
3. Approve worker verification in **Admin → Verification review** (Workers tab).

## 5. Approve jobs
- **Admin → 공고 관리 / Jobs** → Approve (→ OPEN, fans out alerts) / Reject / flag suspicious.
- Employers can also use **Quick Post**; same approval flow.

## 6. Review verification documents
- **Admin → Document review**: open the file (admin-only), Approve / Reject (+ note) / Delete.
- Confirm `/api/verification/documents/<id>` returns 403 for non-admins.

## 7. Handle reports
- **Admin → 신고 / Reports**: filter by reason/status → set REVIEWING → RESOLVED/DISMISSED, add a note.
- Employers with 3+ open reports are auto-flagged (NEEDS_REVIEW) — check **Users**.

## 8. Check analytics
- **Admin → Analytics**: funnel (created → viewed → interest → hired → completed), top districts/categories, notification sent/failed/mocked, verification submissions. Filter 7d / 30d / all.

## 9. Debug notification failures
- **Admin → Notification monitoring**: filter **Failed**; inspect channel/error.
- **Admin → Ops** → **Resend failed notifications** to re-attempt.
- Providers are mock unless `NOTIFICATION_PROVIDER=sms|kakao` + keys are set (otherwise rows show MOCKED).

## 10. Export data
- **Admin → Ops → CSV**: users / jobs / interests / reports (admin-only download).

## 11. Daily pilot checklist
- [ ] Ops page: DB **OK**, failed notifications = 0 (else Resend)
- [ ] Approve pending jobs
- [ ] Review pending documents & verifications
- [ ] Triage open reports
- [ ] Skim Analytics for drop-offs
- [ ] Run `npm run documents:cleanup` (or schedule it) to enforce retention

## 12. Safety escalation checklist
- Suspected scam/fake job → set job **Rejected/Cancelled**, report **RESOLVED**, flag employer.
- Wage/harassment complaint → keep records, advise both parties to contact authorities; platform does **not** adjudicate or guarantee payment.
- Sensitive document concern → **Delete** the document (Ops/Document review); cleanup script purges rejected/expired files.
- Data request / privacy incident → follow PIPA process (counsel-reviewed); export only what's necessary.
