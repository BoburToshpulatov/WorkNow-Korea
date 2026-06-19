import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatsCard({
  label,
  value,
  icon: Icon,
  accent = "text-primary",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
        </div>
        {Icon && <Icon className={cn("h-8 w-8", accent)} />}
      </CardContent>
    </Card>
  );
}
