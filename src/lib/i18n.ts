/**
 * Lightweight i18n for the pilot — no external dependency.
 *
 * - Korean (`ko`) is the default and source-of-truth catalog.
 * - English (`en`) is a full translation of the core product flows.
 * - Uzbek (`uz`) is a placeholder that falls back to Korean key-by-key.
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
 * Resolution: requested locale → Korean fallback → the raw key.
 */
export function translate(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  vars?: Record<string, string | number>
): string {
  const raw = lookup(CATALOGS[locale], key) ?? lookup(ko, key) ?? key;
  return interpolate(raw, vars);
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

/**
 * Korean: `일당 120,000원` · English: `₩120,000/day`.
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
  return `₩${num}${SALARY_SUFFIX_EN[type] ?? ""}`;
}

export function formatDateTime(
  date: Date | string,
  locale: Locale = DEFAULT_LOCALE
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
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
