"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/components/LocaleProvider";

export function UrgentBadge({ className }: { className?: string }) {
  const { t } = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-urgent px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-urgent-foreground animate-pulse-urgent",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white" />
      {t("jobs.filterUrgent")}
    </span>
  );
}
