import "server-only";
import { cookies } from "next/headers";
import {
  createT,
  normalizeLocale,
  LOCALE_COOKIE,
  type Locale,
  type TFunction,
} from "@/lib/i18n";

/** Read the active locale from the cookie (server components). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}

/** Locale-bound translator for server components. */
export async function getT(): Promise<{ locale: Locale; t: TFunction }> {
  const locale = await getLocale();
  return { locale, t: createT(locale) };
}
