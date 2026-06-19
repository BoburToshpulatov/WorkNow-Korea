"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

const OPTIONS = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as const;

/**
 * Admin control to set a worker/employer verification status (Phase 3).
 */
export function VerifyControl({
  target,
  profileId,
  current,
}: {
  target: "WORKER" | "EMPLOYER";
  profileId: string;
  current: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [status, setStatus] = useState(current);
  const [loading, setLoading] = useState(false);

  const update = async (next: string) => {
    if (next === status) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, profileId, status: next }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus(next);
      toast(t("admin.verifyChanged", { status: t(`verification.${next}`) }), "success");
      router.refresh();
    } catch {
      toast(t("admin.verifyFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => update(e.target.value)}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
    >
      {OPTIONS.map((o) => (
        <option key={o} value={o}>
          {t(`verification.${o}`)}
        </option>
      ))}
    </select>
  );
}
