import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/i18n";
import type { Prisma, NotificationDeliveryStatus } from "@prisma/client";

const FILTERS = [
  { value: "all", labelKey: "admin.filterAll" },
  { value: "failed", labelKey: "admin.filterFailed" },
  { value: "mocked", labelKey: "admin.filterMocked" },
  { value: "sent", labelKey: "admin.filterSent" },
  { value: "jobAlerts", labelKey: "admin.filterJobAlerts" },
  { value: "employerAlerts", labelKey: "admin.filterEmployerAlerts" },
];

function whereFor(filter: string): Prisma.NotificationLogWhereInput {
  switch (filter) {
    case "failed":
      return { status: "FAILED" };
    case "mocked":
      return { status: "MOCKED" };
    case "sent":
      return { status: "SENT" };
    case "jobAlerts":
      return { type: "NEW_MATCHING_JOB" };
    case "employerAlerts":
      return { type: "NEW_INTEREST" };
    default:
      return {};
  }
}

const STATUS_VARIANT: Record<
  NotificationDeliveryStatus,
  "success" | "muted" | "urgent" | "secondary"
> = {
  SENT: "success",
  MOCKED: "secondary",
  FAILED: "urgent",
  PENDING: "muted",
};

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const active = filter ?? "all";
  const { t, locale } = await getT();

  const logs = await prisma.notificationLog.findMany({
    where: whereFor(active),
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title={t("admin.notifTitle")} description={t("admin.notifDesc")} />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value === "all"
                ? "/admin/notifications"
                : `/admin/notifications?filter=${f.value}`
            }
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              active === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-accent"
            )}
          >
            {t(f.labelKey)}
          </Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title={t("admin.notifNone")}
          description={t("admin.notifNoneDesc")}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin.colChannel")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.colRecipient")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.colStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("nav.alerts")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.colPosted")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.colError")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t align-top">
                  <td className="px-4 py-3">
                    <Badge variant="muted">{t(`admin.channel${l.channel}`)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.recipient}</div>
                    <div className="text-xs text-muted-foreground">{l.message}</div>
                    {l.jobId && (
                      <Link
                        href={`/worker/jobs/${l.jobId}`}
                        className="text-xs text-primary underline"
                      >
                        {t("admin.viewJob")}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[l.status]}>
                      {t(`admin.status${l.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {l.type}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDateTime(l.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3 text-xs text-destructive">
                    {l.error ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
