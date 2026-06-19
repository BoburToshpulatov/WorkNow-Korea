# WorkNow Korea — Pilot Incident Playbook

Founder-operated. For each scenario: **Detection → Response → Escalation → Recovery.**
Admin tools: `/admin/founder`, `/admin/users` (search + timeline), `/admin/verifications`,
`/admin/documents`, `/admin/reports`, `/admin/notifications`, `/admin/ops`, `/api/health`.

## Fake employer
- **Detect:** report (FAKE_JOB/SCAM_SPAM), 3+ open reports auto-flag (NEEDS_REVIEW), no business doc.
- **Respond:** set employer verification REJECTED; set their jobs CANCELLED/REJECTED; resolve reports.
- **Escalate:** if money was solicited, advise victims to contact police (112) / 고용노동부; preserve records.
- **Recover:** confirm jobs hidden (only OPEN/FILLED are public); note in user timeline.

## Fake worker
- **Detect:** repeated no-shows (NEEDS_REVIEW), employer reports, mismatched ID document.
- **Respond:** set worker verification REJECTED; warn/remove; mark interests NO_SHOW.
- **Escalate:** pattern of fraud → block phone at signup (manual), document in timeline.
- **Recover:** verify affected employers were notified; offer re-match.

## Document abuse (wrong/sensitive/forged upload)
- **Detect:** admin review in `/admin/documents`; user reports.
- **Respond:** Reject + **Delete** the document (file purged, row soft-deleted); ask for correct doc.
- **Escalate:** suspected forgery → reject verification; sensitive over-collection → delete immediately.
- **Recover:** confirm download returns 410; cleanup cron enforces retention.

## Wage complaint
- **Detect:** report UNPAID_WAGE/WRONG_SALARY.
- **Respond:** platform does **not** adjudicate or guarantee pay — record both parties' contact, advise
  worker to keep evidence and contact 고용노동부 (1350). Set report REVIEWING.
- **Escalate:** repeat offender employer → flag NEEDS_REVIEW, consider removal.
- **Recover:** resolve report with admin note; monitor employer's rating.

## Spam jobs
- **Detect:** rate-limit 429s, duplicate postings, reports.
- **Respond:** reject duplicates; the post route is rate-limited (30/min). Tighten limit if needed.
- **Escalate:** mass spam from one account → suspend (reject verification + cancel jobs).
- **Recover:** confirm feed is clean (admin job moderation).

## Mass notification failure
- **Detect:** `/admin/ops` failed count, `/admin/notifications` FAILED filter, founder dashboard.
- **Respond:** **Ops → Resend failed notifications**. Check `NOTIFICATION_PROVIDER` + keys.
- **Escalate:** provider outage → switch to a working channel or stay in-app only.
- **Recover:** confirm failed count drops; in-app inbox is always delivered.

## Database outage
- **Detect:** `/api/health` `db: down` (503); 500s app-wide; Sentry spike.
- **Respond:** check managed Postgres status/connections; verify `DATABASE_URL`.
- **Escalate:** provider incident → status page; pause onboarding comms.
- **Recover:** restore from backup/PITR if needed; `npx prisma migrate status`; re-check health.

## S3 / storage outage
- **Detect:** `npm run storage:check` fails; document upload/download errors (Sentry).
- **Respond:** uploads fail gracefully (500); core marketplace (jobs/alerts/contact) keeps working.
- **Escalate:** provider incident → pause verification doc requests; communicate delay.
- **Recover:** re-run `storage:check`; no data loss (metadata in DB).

## Redis (rate limiter) outage
- **Detect:** rate-limit errors; `rate-limit:check`.
- **Respond:** limiter fails closed to in-memory throttling (still protected). Set
  `RATE_LIMIT_PROVIDER=memory` temporarily if Upstash is down.
- **Escalate:** prolonged outage → keep memory limiter; per-instance limits acceptable at pilot scale.
- **Recover:** restore Upstash, switch back to `redis`.

## Sentry outage
- **Detect:** monitoring dashboard quiet / Sentry status page.
- **Respond:** none required — `captureError` still logs via the structured logger; app unaffected.
- **Escalate:** none.
- **Recover:** Sentry resumes automatically; review buffered logs.
