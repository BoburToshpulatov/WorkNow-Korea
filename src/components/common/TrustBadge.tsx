"use client";

import { Sparkles, ShieldCheck, Star, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/LocaleProvider";
import type { TrustTier } from "@/lib/constants";

const STYLE: Record<
  TrustTier,
  { variant: "muted" | "success" | "secondary" | "urgent"; Icon: typeof Star }
> = {
  NEW: { variant: "muted", Icon: Sparkles },
  VERIFIED: { variant: "success", Icon: ShieldCheck },
  RELIABLE: { variant: "secondary", Icon: Star },
  NEEDS_REVIEW: { variant: "urgent", Icon: AlertTriangle },
};

/** Compact, explainable trust summary (Phase 3). */
export function TrustBadge({
  tier,
  className,
}: {
  tier: TrustTier;
  className?: string;
}) {
  const { t } = useT();
  const { variant, Icon } = STYLE[tier];
  return (
    <Badge variant={variant} className={`gap-1 ${className ?? ""}`}>
      <Icon className="h-3 w-3" />
      {t(`ts.tier${tier}`)}
    </Badge>
  );
}
