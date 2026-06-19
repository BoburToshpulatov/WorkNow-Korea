# WorkNow Korea — Security Review

Targeted review for the deployability phase. ✅ = verified, ⚠ = partial / production TODO.

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | Uploaded files are never public | ✅ | Stored outside `/public` (local `uploads/`, or private S3 bucket); no static route; `storage:check` confirms no public URL is returned. |
| 2 | Document download requires admin | ✅ | `GET /api/verification/documents/[id]` streams bytes only when `role === ADMIN`; HTTP-tested: anon→401, other user→403, owner→metadata JSON, admin→file bytes. |
| 3 | Owner metadata access works | ✅ | Owner receives metadata-only JSON (no `storedFilename`, no bytes). |
| 4 | Public pages don't leak document paths | ✅ | `storedFilename` excluded from list API + never rendered; no document URLs on job cards/public pages. |
| 5 | Logs redact sensitive fields | ✅ | `logger.ts` redacts password/filenames/BRN/secrets and masks phones. |
| 6 | Sentry redacts sensitive fields | ✅ | `error-monitoring.ts` `beforeSend` strips cookies/headers/data + `scrub()` on extras. |
| 7 | Rate limiter covers key write routes | ✅ | login*, register, quick-post, job-post, interest, report, document-upload, review → `enforceRateLimit`; HTTP-tested 30→429. (*login throttled via register/credentials path; harden in Phase next.) |
| 8 | Production env validation catches unsafe config | ✅ | `checkEnv()` returns fatal errors for local storage / placeholder secret / http URL in production; `validateEnv()` throws at boot (instrumentation). |
| 9 | Cron endpoint requires secret | ✅ | `/api/cron/documents-cleanup` → 401 without/with wrong `CRON_SECRET`, 200 with correct (HTTP-tested). |
| 10 | CSV exports are admin-only | ✅ | `/api/admin/export` → 403 for non-admin (HTTP-tested), audit-logged. |

## Additional notes
- Auth: bcrypt password hashing; role-guarded server layouts; ownership checks on job edit/applicants/documents.
- Audit: `AdminAuditLog` records document upload/review/delete, exports, notification reruns, cleanup runs.
- Retention: rejected (14d) + approved/expired (90d) files purged via cron; rows soft-deleted (audit preserved); deleted docs → 410 on download.

## Production TODO (tracked)
- ⚠ Dedicated login rate limiting inside the NextAuth credentials flow.
- ⚠ Malware scanning + EXIF/metadata stripping on uploads.
- ⚠ S3 lifecycle rules as defense-in-depth alongside the cron cleanup.
- ⚠ **PIPA review by Korean counsel** before storing real documents/PII.
- ⚠ Move rate limiting to Redis in production (`RATE_LIMIT_PROVIDER=redis`).
