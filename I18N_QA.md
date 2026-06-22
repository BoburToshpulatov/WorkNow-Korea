# Multilingual QA — WorkNow Korea

The app ships in **Korean (ko, default)**, **English (en)**, and **Uzbek (uz)**.

- Korean is the source of truth.
- English mirrors every Korean key (enforced by `npm run i18n:check`).
- Uzbek covers every **user-facing** flow; admin-only screens fall back to
  English (uz → en → ko), never to mixed Korean.

## Architecture
- Locale is stored in the `worknow_locale` cookie. The root layout reads it
  server-side and sets `<html lang>` + seeds `LocaleProvider`.
- Server components translate via `getT()`; client components via `useT()`.
- Switching language writes the cookie, persists to the user's
  `preferredLocale` when logged in (`PUT /api/me/locale`), and calls
  `router.refresh()` so server-rendered pages re-render.
- Notifications/SMS use the recipient's `preferredLocale` with uz → en → ko
  fallback.

## Automated check
```bash
npm run i18n:check   # fails if EN missing any key, or UZ missing user-facing keys
```

## Manual QA checklist
Run each row in **Korean, English, and Uzbek** (switch via the header globe).

| # | Flow | Pass |
| - | ---- | ---- |
| 1 | Public landing page reads naturally | ☐ ko ☐ en ☐ uz |
| 2 | Login page | ☐ ko ☐ en ☐ uz |
| 3 | Register + choose role | ☐ ko ☐ en ☐ uz |
| 4 | Worker dashboard (availability selector) | ☐ ko ☐ en ☐ uz |
| 5 | Job feed (filters, sort, distance labels) | ☐ ko ☐ en ☐ uz |
| 6 | Job detail (salary, transport, urgency) | ☐ ko ☐ en ☐ uz |
| 7 | Worker interest flow + toast | ☐ ko ☐ en ☐ uz |
| 8 | Notification settings | ☐ ko ☐ en ☐ uz |
| 9 | Employer quick post | ☐ ko ☐ en ☐ uz |
| 10 | Employer applicants + status labels | ☐ ko ☐ en ☐ uz |
| 11 | Rehire page | ☐ ko ☐ en ☐ uz |
| 12 | Switch language **after login** → persists to profile | ☐ |
| 13 | Refresh page → selected language persists | ☐ |
| 14 | Notification/SMS uses the recipient's language | ☐ |

## Formatting expectations
| | Korean | English | Uzbek |
| - | - | - | - |
| Salary | `일당 120,000원` | `₩120,000/day` | `Kuniga 120,000 von` |
| Date/time | 24-hour | 12-hour AM/PM | 24-hour |
| Distance | `2.3km 거리` | `2.3 km away` | `2.3 km uzoqlikda` |

## Intentional fallbacks
- **Admin screens** are not translated to Uzbek → render in English.
- **Legal documents** (terms/privacy/agreements) are Korean-only reference
  text; English/Uzbek show a "translation coming soon" notice.
- API rate-limit error is bilingual ko/en (no locale context in the limiter).
