import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/i18n";
import { REPORT_REASONS, REPORT_STATUSES } from "@/lib/constants";
import { ReportModerationControl } from "@/components/admin/ReportModerationControl";
import type { Prisma } from "@prisma/client";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; status?: string }>;
}) {
  const { reason, status } = await searchParams;
  const { t, locale } = await getT();

  const where: Prisma.ReportWhereInput = {};
  if (reason && REPORT_REASONS.includes(reason as never)) {
    where.reasonCode = reason as never;
  }
  if (status && REPORT_STATUSES.includes(status as never)) {
    where.status = status as never;
  }

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const chip = (
    key: string,
    value: string | undefined,
    active: string,
    label: string
  ) => {
    const params = new URLSearchParams();
    if (reason && key !== "reason") params.set("reason", reason);
    if (status && key !== "status") params.set("status", status);
    if (value) params.set(key, value);
    const href = `/admin/reports${params.toString() ? `?${params}` : ""}`;
    const on = active === (value ?? "");
    return (
      <Link
        key={`${key}-${value ?? "all"}`}
        href={href}
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium",
          on
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input hover:bg-accent"
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <div>
      <PageHeader title={t("admin.reportsTitle")} description={t("admin.reportsDesc")} />

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{t("ts.reportsFilterReason")}:</span>
        {chip("reason", undefined, reason ?? "", t("common.all"))}
        {REPORT_REASONS.map((r) => chip("reason", r, reason ?? "", t(`reportReason.${r}`)))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{t("ts.reportsFilterStatus")}:</span>
        {chip("status", undefined, status ?? "", t("common.all"))}
        {REPORT_STATUSES.map((s) => chip("status", s, status ?? "", t(`reportStatus.${s}`)))}
      </div>

      {reports.length === 0 ? (
        <EmptyState title={t("admin.noReports")} description={t("admin.noReportsDesc")} />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{t(`reportReason.${r.reasonCode}`)}</p>
                <Badge variant="muted">{t(`reportStatus.${r.status}`)}</Badge>
              </div>
              {r.details && (
                <p className="mt-1 text-sm text-muted-foreground">{r.details}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(r.createdAt, locale)}
                {r.jobId && (
                  <>
                    {" · "}
                    <Link href={`/worker/jobs/${r.jobId}`} className="text-primary underline">
                      {t("ts.relatedJob")}
                    </Link>
                  </>
                )}
              </p>
              <div className="mt-3 border-t pt-3">
                <ReportModerationControl
                  reportId={r.id}
                  status={r.status}
                  adminNote={r.adminNote}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
