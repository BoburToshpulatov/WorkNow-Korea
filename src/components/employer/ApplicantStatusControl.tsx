"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";
import { INTEREST_STATUS_FLOW } from "@/lib/constants";

/**
 * Employer-side control to move an applicant through the hiring lifecycle:
 * 관심 표시 → 연락함 → 채용 확정 → 근무 완료 (또는 노쇼).
 */
export function ApplicantStatusControl({
  jobId,
  interestId,
  currentStatus,
}: {
  jobId: string;
  interestId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const update = async (next: string) => {
    if (next === status) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/applicants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interestId, status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data?.error === "WORKERS_FULL") {
        toast(t("ts.hiredFull"), "error");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      setStatus(next);
      toast(
        t("employer.statusChanged", { status: t(`applicantStatus.${next}`) }),
        "success"
      );
      // When the job is now fully staffed, suggest marking it filled.
      if (data?.full) toast(t("ts.hiredFull"), "success");
      router.refresh();
    } catch {
      toast(t("employer.statusChangeFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {t("employer.currentStatus")}
        </span>
        <Badge variant={status === "HIRED" ? "success" : "muted"}>
          {t(`applicantStatus.${status}`)}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {INTEREST_STATUS_FLOW.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading || s === status}
            onClick={() => update(s)}
            className={
              "rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 " +
              (s === status
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-accent")
            }
          >
            {t(`applicantStatus.${s}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
