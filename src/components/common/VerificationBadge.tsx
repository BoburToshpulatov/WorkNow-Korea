"use client";

import { ShieldCheck, ShieldAlert, ShieldX, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/LocaleProvider";
import { cn } from "@/lib/utils";

type Status = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

const STYLE: Record<
  Status,
  { variant: "success" | "muted" | "outline" | "urgent"; Icon: typeof ShieldCheck }
> = {
  VERIFIED: { variant: "success", Icon: ShieldCheck },
  PENDING: { variant: "outline", Icon: Clock },
  UNVERIFIED: { variant: "muted", Icon: ShieldAlert },
  REJECTED: { variant: "urgent", Icon: ShieldX },
};

/**
 * Trust signal shown on profiles, job cards, and applicant cards.
 * Defaults to a compact form; pass `size="sm"` to shrink further.
 */
export function VerificationBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const { t } = useT();
  const s = (status as Status) in STYLE ? (status as Status) : "UNVERIFIED";
  const { variant, Icon } = STYLE[s];
  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {t(`verification.${s}`)}
    </Badge>
  );
}
