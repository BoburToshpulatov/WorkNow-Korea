/**
 * Lightweight i18n for the pilot — no external dependency.
 *
 * - Korean (`ko`) is the default and source-of-truth catalog.
 * - English (`en`) is a complete mirror of every Korean key.
 * - Uzbek (`uz`) covers all user-facing flows; admin-only keys fall back
 *   through the chain uz → en → ko (see FALLBACK_CHAIN).
 *
 * Call sites never import catalogs directly. They use a bound `t()` from
 * `getT()` (server) or `useT()` (client), so swapping in next-intl later is a
 * localized change.
 */
import ko from "@/locales/ko";
import en from "@/locales/en";
import uz from "@/locales/uz";
import type { SalaryTypeKey } from "@/lib/utils";

export type Locale = "ko" | "en" | "uz";

export const DEFAULT_LOCALE: Locale = "ko";
export const SUPPORTED_LOCALES: Locale[] = ["ko", "en", "uz"];
export const LOCALE_COOKIE = "worknow_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  uz: "O‘zbekcha",
};

const CATALOGS: Record<Locale, unknown> = { ko, en, uz };

/**
 * Per-locale fallback chain. Korean is the source of truth, English is a
 * complete mirror, so an untranslated Uzbek key resolves to English (NOT
 * Korean) — admin screens with no Uzbek read cleanly in English instead of
 * showing mixed Korean text.
 */
const FALLBACK_CHAIN: Record<Locale, Locale[]> = {
  ko: ["ko"],
  en: ["en", "ko"],
  uz: ["uz", "en", "ko"],
};

export function normalizeLocale(value?: string | null): Locale {
  return value === "en" || value === "uz" || value === "ko"
    ? value
    : DEFAULT_LOCALE;
}

function lookup(catalog: unknown, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      catalog
    );
  return typeof value === "string" ? value : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`
  );
}

/**
 * Translate a dot-namespaced key.
 * Resolution follows the locale's fallback chain (e.g. uz → en → ko), then the
 * raw key as a last resort.
 */
export function translate(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  vars?: Record<string, string | number>
): string {
  let raw: string | undefined;
  for (const loc of FALLBACK_CHAIN[locale] ?? [locale, "ko"]) {
    raw = lookup(CATALOGS[loc], key);
    if (raw !== undefined) break;
  }
  return interpolate(raw ?? key, vars);
}

/** A locale-bound translator returned by getT()/useT(). */
export type TFunction = (
  key: string,
  vars?: Record<string, string | number>
) => string;

export function createT(locale: Locale): TFunction {
  return (key, vars) => translate(key, locale, vars);
}

// ── Locale-aware formatters ─────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return `₩${new Intl.NumberFormat("ko-KR").format(amount)}`;
}

const SALARY_SUFFIX_EN: Record<SalaryTypeKey, string> = {
  HOURLY: "/hr",
  DAILY: "/day",
  MONTHLY: "/mo",
  FIXED: "",
};
const SALARY_PREFIX_KO: Record<SalaryTypeKey, string> = {
  HOURLY: "시급",
  DAILY: "일당",
  MONTHLY: "월급",
  FIXED: "",
};
const SALARY_PREFIX_UZ: Record<SalaryTypeKey, string> = {
  HOURLY: "Soatiga",
  DAILY: "Kuniga",
  MONTHLY: "Oyiga",
  FIXED: "",
};

/**
 * Korean: `일당 120,000원` · English: `₩120,000/day` · Uzbek: `Kuniga 120,000 von`.
 */
export function formatJobSalary(
  amount: number,
  type: SalaryTypeKey,
  locale: Locale = DEFAULT_LOCALE
): string {
  const num = new Intl.NumberFormat("ko-KR").format(amount);
  if (locale === "ko") {
    const prefix = SALARY_PREFIX_KO[type] ?? "";
    return prefix ? `${prefix} ${num}원` : `${num}원`;
  }
  if (locale === "uz") {
    const prefix = SALARY_PREFIX_UZ[type] ?? "";
    return prefix ? `${prefix} ${num} von` : `${num} von`;
  }
  return `₩${num}${SALARY_SUFFIX_EN[type] ?? ""}`;
}

export function formatDateTime(
  date: Date | string,
  locale: Locale = DEFAULT_LOCALE
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // Uzbek + Korean use 24-hour time; English uses 12-hour AM/PM.
  const intlLocale =
    locale === "ko" ? "ko-KR" : locale === "uz" ? "uz-Latn" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: locale === "en" ? "h12" : "h23",
  }).format(d);
}

/** Joins province / city / district in a sensible order per locale. */
export function formatJobLocation(
  loc: { province?: string | null; city?: string | null; district?: string | null },
  _locale: Locale = DEFAULT_LOCALE
): string {
  // Korean place names are used in both locales; order is the same.
  const parts = [loc.city, loc.district].filter(Boolean) as string[];
  return parts.join(" ");
}
