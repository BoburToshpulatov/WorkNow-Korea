"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JobStatus } from "@/components/jobs/JobStatus";
import { formatJobSalary, formatDateTime } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";
import type { JobWithEmployer } from "@/types";
import type { JobStatus as JobStatusEnum } from "@prisma/client";

export function JobTable({ jobs }: { jobs: JobWithEmployer[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useT();
  const [busy, setBusy] = useState<string | null>(null);

  const setStatus = async (id: string, status: JobStatusEnum) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed");
      toast(t("admin.statusChanged"), "success");
      router.refresh();
    } catch {
      toast(t("admin.actionFailed"), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">{t("admin.colTitle")}</th>
            <th className="px-4 py-3 font-medium">{t("admin.colCategory")}</th>
            <th className="px-4 py-3 font-medium">{t("admin.colSalary")}</th>
            <th className="px-4 py-3 font-medium">{t("admin.colStatus")}</th>
            <th className="px-4 py-3 font-medium">{t("admin.colPosted")}</th>
            <th className="px-4 py-3 font-medium">{t("admin.colActions")}</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-t align-top">
              <td className="px-4 py-3 font-medium">{job.title}</td>
              <td className="px-4 py-3">
                {t(`enums.category.${job.category}`)}
              </td>
              <td className="px-4 py-3 font-semibold text-success">
                {formatJobSalary(job.salaryAmount, job.salaryType, locale)}
              </td>
              <td className="px-4 py-3">
                <JobStatus status={job.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDateTime(job.createdAt, locale)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="success"
                    disabled={busy === job.id}
                    onClick={() => setStatus(job.id, "OPEN")}
                  >
                    {t("admin.approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy === job.id}
                    onClick={() => setStatus(job.id, "REJECTED")}
                  >
                    {t("admin.reject")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === job.id}
                    onClick={() => setStatus(job.id, "CANCELLED")}
                  >
                    {t("admin.suspicious")}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
