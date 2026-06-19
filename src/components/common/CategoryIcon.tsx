import { CATEGORY_MAP, type CategoryValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CategoryIcon({
  category,
  className,
  showLabel = false,
}: {
  category: CategoryValue;
  className?: string;
  showLabel?: boolean;
}) {
  const def = CATEGORY_MAP[category];
  if (!def) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span aria-hidden>{def.icon}</span>
      {showLabel && <span>{def.label}</span>}
    </span>
  );
}
