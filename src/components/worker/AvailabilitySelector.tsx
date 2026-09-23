"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useT } from "@/components/LocaleProvider";

const STATUSES = [
  "AVAILABLE_NOW",
  "AVAILABLE_TODAY",
  "AVAILABLE_TONIGHT",
  "AVAILABLE_TOMORROW",
  "WEEKENDS_ONLY",
  "UNAVAILABLE",
] as const;

type Status = (typeof STATUSES)[number];

export function AvailabilitySelector({ current }: { current: Status }) {
  const { t } = useT();
  const router = useRouter();
  const [status, setStatus] = useState<Status>(current);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function update(next: Status) {
    const prev = status;
    setStatus(next); // optimistic
    setMsg(null);
    try {
      const res = await fetch("/api/worker/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityStatus: next }),
      });
      if (!res.ok) throw new Error();
      setMsg(t("match.availUpdated"));
      startTransition(() => router.refresh());
    } catch {
      setStatus(prev); // revert
      setMsg(t("match.availError"));
    }
  }

  return (
    <Card className="border-primary/40">
      <CardContent className="p-4">
        <p className="text-sm font-semibold">{t("match.availTitle")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("match.availHint")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => update(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
                status === s
                  ? s === "UNAVAILABLE"
                    ? "border-urgent bg-urgent text-white"
                    : "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              )}
            >
              {t(`enums.availabilityStatus.${s}`)}
            </button>
          ))}
        </div>
        {msg && <p className="mt-2 text-xs text-muted-foreground">{msg}</p>}
      </CardContent>
    </Card>
  );
}
