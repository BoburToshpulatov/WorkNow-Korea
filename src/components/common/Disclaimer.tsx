"use client";

import { AlertTriangle } from "lucide-react";
import { useT } from "@/components/LocaleProvider";
import { cn } from "@/lib/utils";

export function Disclaimer({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { t } = useT();
  const text = t("legal.disclaimer");

  if (compact) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>{text}</p>
    );
  }
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <p>{text}</p>
    </div>
  );
}
