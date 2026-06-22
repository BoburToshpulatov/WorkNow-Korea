"use client";

import { Globe } from "lucide-react";
import { useT } from "@/components/LocaleProvider";
import { SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

/**
 * Language switcher. Korean, English, and Uzbek are all live.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useT();

  return (
    <label
      className={`inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm ${className ?? ""}`}
    >
      <Globe className="h-4 w-4 text-muted-foreground" />
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="bg-transparent pr-1 outline-none"
        aria-label="Language"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
