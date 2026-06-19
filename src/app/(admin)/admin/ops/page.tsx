import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { env } from "@/lib/env";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RerunNotificationsButton } from "@/components/admin/RerunNotificationsButton";
import { TestSmsCard } from "@/components/admin/TestSmsCard";
import { formatDateTime } from "@/lib/i18n";
import type { Prisma } from "@prisma/client";

async function dbOk(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export default async function AdminOpsPage({
  searchParams,
}: {
  searchParams: Promise<{ sms?: string }>;
}) {
  const { t, locale } = await getT();
  const { sms } = await searchParams;
  const smsWhere: Prisma.NotificationLogWhereInput = { channel: "SMS" };
  if (sms === "SENT" || sms === "FAILED" || sms === "MOCKED") smsWhere.status = sms;

  const [healthy, pendingJobs, failedNotifs, openReports, pendingDocs, flagged, smsLogs] =
    await Promise.all([
      dbOk(),
      prisma.job.count({ where: { status: "PENDING" } }),
      prisma.notificationLog.count({ where: { status: "FAILED" } }),
      prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
      prisma.verificationDocument.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.employerProfile.count({ where: { flaggedForReview: true } }),
      prisma.notificationLog.findMany({ where: smsWhere, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  const exports: { type: string; label: string }[] = [
    { type: "users", label: t("admin.exportUsers") },
    { type: "jobs", label: t("admin.exportJobs") },
    { type: "interests", label: t("admin.exportInterests") },
    { type: "reports", label: t("admin.exportReports") },
    { type: "verifications", label: t("ts.verifQueueTitle") },
  ];

  return (
    <div>
      <PageHeader title={t("admin.opsTitle")} description={t("admin.opsDesc")} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.health")}</CardTitle>
          </CardHeader>
          <CardContent>
            {row(
              t("admin.dbStatus"),
              <Badge variant={healthy ? "success" : "urgent"}>
                {healthy ? t("admin.statusOk") : t("admin.statusDown")}
              </Badge>
            )}
            {row(t("admin.appEnvLabel"), env.appEnv)}
            {row(t("admin.notifMode"), env.notificationProvider)}
            {row(t("admin.storageMode"), env.uploadStorage)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.moderationQueue")}</CardTitle>
          </CardHeader>
          <CardContent>
            {row(t("admin.pendingJobs"), pendingJobs)}
            {row(t("admin.notifFailed"), failedNotifs)}
            {row(t("admin.pendingReports"), openReports)}
            {row(t("admin.pendingDocs"), pendingDocs)}
            {row(t("admin.usersNeedingReview"), flagged)}
            <div className="pt-3">
              <RerunNotificationsButton />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">CSV</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {exports.map((e) => (
            <Button key={e.type} asChild size="sm" variant="outline">
              <a href={`/api/admin/export?type=${e.type}`}>{e.label}</a>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* SMS testing + delivery logs (Phase 3) */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TestSmsCard />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              SMS delivery logs ({env.notificationProvider})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {["all", "SENT", "FAILED", "MOCKED"].map((s) => (
                <a
                  key={s}
                  href={s === "all" ? "/admin/ops" : `/admin/ops?sms=${s}`}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    (sms ?? "all") === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  {s}
                </a>
              ))}
            </div>
            {smsLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No SMS logs.</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {smsLogs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 border-b py-1">
                    <span className="truncate">
                      <Badge
                        variant={l.status === "FAILED" ? "urgent" : l.status === "SENT" ? "success" : "muted"}
                      >
                        {l.status}
                      </Badge>{" "}
                      {l.recipient}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatDateTime(l.createdAt, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
