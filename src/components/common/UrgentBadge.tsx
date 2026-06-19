import { cn } from "@/lib/utils";

export function UrgentBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-urgent px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-urgent-foreground animate-pulse-urgent",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white" />
      Urgent
    </span>
  );
}
