# Launch Checklist — WorkNow Korea

Everything between a working staging environment (`STAGING_DEPLOYMENT_PLAN.md`)
and real users in production. Work top to bottom; the legal items have the
longest lead times, so start them first.

> The legal/regulatory items below are the questions to put to Korean counsel —
> they are not legal advice. Each one names the law so counsel can confirm it
> applies and what exactly is required.

---

## 1. Legal & regulatory (start now — weeks of lead time)

| # | Item | Why | Owner |
| - | ---- | --- | ----- |
| L1 | **사업자등록** (business registration) | Prerequisite for everything below; the number is shown in the footer (`BUSINESS_REG_NO`). | Founder |
| L2 | **직업정보제공사업 신고** with the regional 고용노동부 office (직업안정법 §23) | Running a job-information site generally requires this filing; the filing number must be shown on the site (`JOB_INFO_REG_NO`). Ask counsel which obligations follow (e.g. verifying employer identity before posting — our employer verification + auto-publish-only-for-verified rule is built for this). | Counsel |
| L3 | **Stay a job-information provider, not a staffing agency** (직업안정법 유료직업소개 / 파견법) | We never take a cut of wages, don't supervise work, and charge employers per listing/plan — **not per hire**. Confirm the pricing model keeps us outside 유료직업소개사업 registration, and don't add success fees without re-checking. | Counsel |
| L4 | **Privacy policy (PIPA)** — replace the `[초안]`/`[Draft]` text | Must list items collected, purposes, retention (documents: 90 days approved / 14 rejected), **processors (처리위탁)**: Vercel, Supabase, AWS, Upstash, Sentry, Solapi — and **overseas transfer (국외이전)** for US-based processors (Vercel, Sentry, Upstash). Names the 개인정보 보호책임자 (`PRIVACY_OFFICER`). | Counsel |
| L5 | **ID documents & 주민등록번호** (PIPA §24-2) | Collecting resident-registration numbers is heavily restricted. The upload screen now asks users to cover the last 7 digits; counsel should confirm that's sufficient for 외국인등록증 / business docs and that retention periods are right. | Counsel |
| L6 | **Terms, worker agreement, employer agreement** — replace draft text | Current copy in `src/locales/*.ts` (`legal.*` keys) is marked draft in all three languages; Korean is the governing text, EN/UZ are convenience translations (already labeled). | Counsel |
| L7 | **SMS alerts vs. advertising** (정보통신망법 §50) | If job alerts count as 광고성 정보: "(광고)" prefix, free opt-out number, and separate consent for 21:00–08:00 sends. Our quiet hours are per-worker, not a blanket 21–08 block. | Counsel |
| L8 | **Location data** (위치정보법) | Workers currently type lat/lng by hand (optional, used for distance). Device GPS would likely require 위치기반서비스사업 신고 + consent. **Recommendation:** before launch, replace the lat/lng fields with district-based distance, and don't add GPS until counsel confirms the filing. | Product + Counsel |
| L9 | **통신판매업 신고** (전자상거래법) | Needed before charging employers (paid plans / urgent boost). Pilot is free, so this can follow launch. `ECOMMERCE_REG_NO` then appears in the footer. | Founder |
| L10 | **Foreign-worker eligibility** | Visa categories limit which jobs a worker may take (e.g. E-9 side jobs). The platform shows an eligibility disclaimer; counsel should confirm the wording and that we don't need to gate postings by visa. | Counsel |

## 2. Production environment

Mirror staging with **separate** accounts/resources — never share the staging DB,
bucket, or keys.

- [ ] Supabase project `worknow-prod` (Seoul), S3 bucket `worknow-prod-docs`
      (ap-northeast-2, private) + its own IAM user, Upstash DB, Sentry project.
- [ ] Vercel project `worknow` → Production Branch = `main`, Build Command
      `npm run build:deploy`, same variables as staging plus:
  - `APP_ENV=production`, `NOTIFICATION_PROVIDER=sms` (+ Solapi keys)
  - Operator details: `BUSINESS_NAME`, `BUSINESS_REPRESENTATIVE`, `BUSINESS_REG_NO`,
    `JOB_INFO_REG_NO`, `BUSINESS_ADDRESS`, `BUSINESS_PHONE`, `BUSINESS_EMAIL`,
    `PRIVACY_OFFICER` — **production refuses to boot without these.**
- [ ] `npm run env:check -- .env.production` passes (from `vercel env pull`).
- [ ] GitHub secrets `PRODUCTION_APP_URL` + `PRODUCTION_CRON_SECRET` (hourly job expiry).
- [ ] **Do not seed production.** Register your own account in the app, then:
      `DATABASE_URL="<prod session pooler>" npm run admin:promote -- 010-xxxx-xxxx`
- [ ] Supabase: enable Point-in-Time Recovery or daily backups.

## 3. Domain

- [ ] Buy the domain (a short one — it appears in every SMS link, e.g. `worknow.kr`).
- [ ] Vercel → project → Domains → add apex + `www`; set the DNS records it shows.
- [ ] Set `APP_URL` and `NEXTAUTH_URL` to `https://<domain>` and redeploy.
- [ ] Optional: `staging.<domain>` on the staging project.

## 4. SMS go-live

- [ ] Solapi sender number approved (발신번호 등록) and set as `SMS_SENDER_PHONE`.
- [ ] Admin → Ops → **Test SMS** to your phone from production.
- [ ] Post a real urgent job in your own district → confirm the alert text,
      the `https://<domain>/j/…` link, and the employer "new applicant" SMS.
- [ ] Top up the Solapi balance; set a low-balance alert.

## 5. Final checks (launch day)

- [ ] `CRON_SECRET=… npm run smoke -- https://<domain>` passes
- [ ] `/api/health` → `appEnv=production`, `commit` = released SHA
- [ ] Footer shows all operator details; legal pages have no `[초안]`/`[Draft]`
- [ ] `robots.txt` allows `/` (production only); staging still shows noindex
- [ ] Sentry receives a test error
- [ ] Release tagged (`v0.3.0`) and `CHANGELOG.md` updated

## 6. Soft launch — one district

Start with **one district** (e.g. 대구 달서구): ~20 employers, ~100 workers,
onboarded by hand per `PILOT_RUNBOOK.md`.

**Watch daily:** Admin → Analytics → **Matching speed**
- *Jobs waiting for applicants* — call nearby workers yourself; this list is
  the pilot's to-do list.
- *Urgent jobs answered within 2h* — the product promise.

**Go / no-go to expand to a second district** (after 4 weeks):

| Metric | Target |
| ------ | ------ |
| Urgent jobs answered within 2h | ≥ 80% |
| Median time to first applicant | ≤ 60 min |
| Jobs with an applicant | ≥ 70% |
| Employers posting again within 30 days | ≥ 50% |
| Open safety reports unresolved > 48h | 0 |

If a metric misses, fix supply in the current district (recruit workers where
jobs stall, by category) before adding demand elsewhere.
