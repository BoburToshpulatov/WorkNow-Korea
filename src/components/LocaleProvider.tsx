"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  createT,
  LOCALE_COOKIE,
  type Locale,
  type TFunction,
} from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  t: TFunction;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Provides the active locale to client components. The initial value comes
 * from the server (cookie) via the root layout, so SSR and the first client
 * render agree (no hydration mismatch).
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      // Persist for SSR (cookie) and as a client hint (localStorage).
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      try {
        localStorage.setItem(LOCALE_COOKIE, next);
      } catch {
        /* ignore */
      }
      // Persist to the user's profile when logged in (used for SMS/notifications).
      // Best-effort: the endpoint 401s for anonymous visitors, which we ignore.
      void fetch("/api/me/locale", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      }).catch(() => undefined);
      // Re-render server components with the new locale.
      router.refresh();
    },
    [router]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale: initialLocale, t: createT(initialLocale), setLocale }),
    [initialLocale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/** Locale-bound translator + switcher for client components. */
export function useT() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Safe fallback so a stray client component never crashes.
    return {
      locale: "ko" as Locale,
      t: createT("ko"),
      setLocale: () => undefined,
    };
  }
  return ctx;
}
