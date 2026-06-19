import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/constants";
import type { AnalyticsEventType } from "@prisma/client";

const RANGES: Record<string, number | null> = {
  "7": 7,
  "30": 30,
  all: null,
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const active = range && range in RANGES ? range : "30";
  const days = RANGES[active];
  const { t } = await getT();

  const since = days ? new Date(Date.now() - days * 86400000) : undefined;
  const evWhere = since ? { createdAt: { gte: since } } : {};
  const jobWhere = since ? { createdAt: { gte: since } } : {};

  const [eventGroups, notifGroups, topDistricts, topCategories, wSubs, eSubs] =
    await Promise.all([
      prisma.analyticsEvent.groupBy({ by: ["type"], where: evWhere, _count: true }),
      prisma.notificationLog.groupBy({
        by: ["status"],
        where: since ? { createdAt: { gte: since } } : {},
        _count: true,
      }),
      prisma.job.groupBy({
        by: ["district"],
        where: jobWhere,
        _count: true,
        orderBy: { _count: { district: "desc" } },
        take: 5,
      }),
      prisma.job.groupBy({
        by: ["category"],
        where: jobWhere,
        _count: true,
        orderBy: { _count: { category: "desc" } },
        take: 5,
      }),
      prisma.workerProfile.count({ where: { verificationStatus: { not: "UNVERIFIED" } } }),
      prisma.employerProfile.count({ where: { verificationStatus: { not: "UNVERIFIED" } } }),
    ]);

  const ev = (type: AnalyticsEventType) =>
    eventGroups.find((g) => g.type === type)?._count ?? 0;
  const notif = (s: string) =>
    notifGroups.find((g) => g.status === s)?._count ?? 0;

  const funnel: { key: string; value: number }[] = [
    { key: "evJOB_CREATED", value: ev("JOB_CREATED") },
    { key: "evJOB_VIEWED", value: ev("JOB_VIEWED") },
    { key: "evJOB_INTERESTED", value: ev("JOB_INTERESTED") },
    { key: "evWORKER_HIRED", value: ev("WORKER_HIRED") },
    { key: "evJOB_COMPLETED", value: ev("JOB_COMPLETED") },
  ];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.value));

  return (
    <div>
      <PageHeader title={t("admin.analyticsTitle")} description={t("admin.analyticsDesc")} />

      <div className="mb-4 flex gap-2">
        {(["7", "30", "all"] as const).map((r) => (
          <Link
            key={r}
            href={`/admin/analytics?range=${r}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              active === r
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-accent"
            )}
          >
            {t(r === "7" ? "admin.filter7" : r === "30" ? "admin.filter30" : "admin.filterAllTime")}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label={t("admin.evJOB_CREATED")} value={ev("JOB_CREATED")} />
        <StatsCard label={t("admin.evJOB_VIEWED")} value={ev("JOB_VIEWED")} />
        <StatsCard label={t("admin.evJOB_INTERESTED")} value={ev("JOB_INTERESTED")} />
        <StatsCard label={t("admin.evWORKER_HIRED")} value={ev("WORKER_HIRED")} />
        <StatsCard label={t("admin.evJOB_COMPLETED")} value={ev("JOB_COMPLETED")} />
        <StatsCard label={t("admin.notifSent")} value={notif("SENT")} />
        <StatsCard label={t("admin.notifFailed")} value={notif("FAILED")} />
        <StatsCard label={t("admin.notifMocked")} value={notif("MOCKED")} />
        <StatsCard label={t("admin.workerVerifSubs")} value={wSubs} />
        <StatsCard label={t("admin.employerVerifSubs")} value={eSubs} />
      </div>

      {/* Funnel */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("admin.funnel")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {funnel.map((f) => (
            <div key={f.key} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-sm text-muted-foreground">
                {t(`admin.${f.key}`)}
              </span>
              <div className="h-5 flex-1 rounded bg-gray-100">
                <div
                  className="h-5 rounded bg-primary"
                  style={{ width: `${(f.value / funnelMax) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm font-medium">{f.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.topDistricts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {topDistricts.map((d) => (
              <div key={d.district ?? "-"} className="flex justify-between">
                <span>{d.district ?? "—"}</span>
                <span className="font-medium">{d._count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.topCategories")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {topCategories.map((c) => (
              <div key={c.category} className="flex justify-between">
                <span>{categoryLabel(c.category)}</span>
                <span className="font-medium">{c._count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
