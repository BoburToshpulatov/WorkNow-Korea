"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";
import { REPORT_STATUSES } from "@/lib/constants";

/** Admin changes a report's status + internal note (Phase 4). */
export function ReportModerationControl({
  reportId,
  status,
  adminNote,
}: {
  reportId: string;
  status: string;
  adminNote: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [note, setNote] = useState(adminNote ?? "");
  const [loading, setLoading] = useState(false);

  const update = async (next: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportId, status: next, adminNote: note }),
      });
      if (!res.ok) throw new Error("failed");
      toast(t("admin.statusChanged"), "success");
      router.refresh();
    } catch {
      toast(t("admin.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("ts.notePlaceholder")}
      />
      <div className="flex flex-wrap gap-1.5">
        {REPORT_STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={s === status ? "default" : "outline"}
            disabled={loading || s === status}
            onClick={() => update(s)}
          >
            {t(`reportStatus.${s}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
