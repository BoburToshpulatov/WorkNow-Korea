"use client";

import { Info } from "lucide-react";
import { useT } from "@/components/LocaleProvider";

/**
 * Shown at the top of legal pages when the UI is not Korean: the Korean text
 * remains the authoritative reference until translations are ready.
 */
export function LegalNotice() {
  const { locale, t } = useT();
  if (locale === "ko") return null;
  return (
    <div className="mb-6 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{t("legal.englishSoon")}</p>
    </div>
  );
}
