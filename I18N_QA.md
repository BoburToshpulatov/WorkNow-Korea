# Multilingual QA — WorkNow Korea

The app ships in **Korean (ko, default)**, **English (en)**, and **Uzbek (uz)**.

- Korean is the source of truth.
- English mirrors every Korean key (enforced by `npm run i18n:check`).
- **Uzbek mirrors every Korean key too** — including admin and legal pages.
  There is no "admin fallback to English" anymore. Fallback (uz → en → ko)
  exists only as a safety net for unexpected missing keys.

## Architecture
- Locale is stored in the `worknow_locale` cookie. The root layout reads it
  server-side and sets `<html lang>` + seeds `LocaleProvider`.
- Server components translate via `getT()`; client components via `useT()`.
- Switching language writes the cookie, persists to the user's
  `preferredLocale` when logged in (`PUT /api/me/locale`), and calls
  `router.refresh()` so server-rendered pages re-render.
- Notifications/SMS use the recipient's `preferredLocale` with uz → en → ko
  fallback.

## Automated checks
```bash
npm run i18n:check          # fails if EN or UZ is missing ANY key (admin + legal included)
npm run i18n:scan           # report hardcoded user-visible strings
npm run i18n:scan -- --ci   # exit 1 if any hardcoded strings (runs in CI)
```
Mark a confirmed false positive with a trailing `// i18n-ignore` comment.

## Manual QA checklist
Run each row in **Korean, English, and Uzbek** (switch via the header globe,
refresh, and confirm no wrong-language text or raw keys).

### Public
| # | Flow | Pass |
| - | ---- | ---- |
| 1 | Landing page | ☐ ko ☐ en ☐ uz |
| 2 | How it works | ☐ ko ☐ en ☐ uz |
| 3 | Pricing | ☐ ko ☐ en ☐ uz |
| 4 | Safety | ☐ ko ☐ en ☐ uz |
| 5 | Terms / Privacy / Worker & Employer agreements (+ notice) | ☐ ko ☐ en ☐ uz |
| 6 | Login / Register / Choose role | ☐ ko ☐ en ☐ uz |

### Worker
| # | Flow | Pass |
| - | ---- | ---- |
| 7 | Dashboard (availability selector) | ☐ ko ☐ en ☐ uz |
| 8 | Job feed (filters, sort, distance) | ☐ ko ☐ en ☐ uz |
| 9 | Job detail (salary, transport, urgency) | ☐ ko ☐ en ☐ uz |
| 10 | Interest flow + toast | ☐ ko ☐ en ☐ uz |
| 11 | My Applications | ☐ ko ☐ en ☐ uz |
| 12 | Notification settings | ☐ ko ☐ en ☐ uz |
| 13 | Profile | ☐ ko ☐ en ☐ uz |

### Employer
| # | Flow | Pass |
| - | ---- | ---- |
| 14 | Dashboard | ☐ ko ☐ en ☐ uz |
| 15 | Quick post / detailed post / edit job | ☐ ko ☐ en ☐ uz |
| 16 | My jobs | ☐ ko ☐ en ☐ uz |
| 17 | Applicants + status labels | ☐ ko ☐ en ☐ uz |
| 18 | Rehire page | ☐ ko ☐ en ☐ uz |
| 19 | Profile / verification / documents | ☐ ko ☐ en ☐ uz |

### Admin (now fully translated)
| # | Flow | Pass |
| - | ---- | ---- |
| 20 | Dashboard | ☐ ko ☐ en ☐ uz |
| 21 | Founder dashboard | ☐ ko ☐ en ☐ uz |
| 22 | Analytics | ☐ ko ☐ en ☐ uz |
| 23 | Ops (health, CSV, SMS logs) | ☐ ko ☐ en ☐ uz |
| 24 | Users (search, filters, table) | ☐ ko ☐ en ☐ uz |
| 25 | User timeline | ☐ ko ☐ en ☐ uz |
| 26 | Jobs moderation | ☐ ko ☐ en ☐ uz |
| 27 | Reports | ☐ ko ☐ en ☐ uz |
| 28 | Documents | ☐ ko ☐ en ☐ uz |
| 29 | Notifications log | ☐ ko ☐ en ☐ uz |
| 30 | Verifications | ☐ ko ☐ en ☐ uz |

### Cross-cutting
| # | Check | Pass |
| - | ---- | ---- |
| 31 | Mobile bottom nav + header menu translated | ☐ ko ☐ en ☐ uz |
| 32 | Switch language after login → persists to profile | ☐ |
| 33 | Refresh keeps selected language | ☐ |
| 34 | No raw translation keys anywhere | ☐ |
| 35 | Notification/SMS uses the recipient's language | ☐ |

## Formatting expectations
| | Korean | English | Uzbek |
| - | - | - | - |
| Salary | `일당 120,000원` | `₩120,000/day` | `Kuniga 120,000 von` |
| Date/time | 24-hour | 12-hour AM/PM | 24-hour |
| Distance | `2.3km 거리` | `2.3 km away` | `2.3 km uzoqlikda` |

## Intentional exceptions (allowed non-localized)
- **Brand wordmark** "WorkNow Korea" (logo) — brand identity, same in all
  languages (allowlisted in `i18n:scan`).
- **Legal page body** is a `[Draft]/[초안]` placeholder pending counsel review;
  each page shows a per-language notice (Korean: reference pending review;
  English/Uzbek: translation for convenience only).
- **API rate-limit error** is bilingual ko/en (the limiter has no locale).
- README/docs, code comments, logs, enum identifiers, and seed demo content.
