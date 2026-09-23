"use client";

import { Info } from "lucide-react";
import { useT } from "@/components/LocaleProvider";

/**
 * Shown at the top of legal pages in every language. Korean explains the text
 * is the reference pending counsel review; English/Uzbek note the translation
 * is for convenience only and the Korean version is authoritative.
 */
export function LegalNotice() {
  const { t } = useT();
  return (
    <div className="mb-6 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{t("legal.notice")}</p>
    </div>
  );
}
