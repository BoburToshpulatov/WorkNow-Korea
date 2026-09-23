import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/getT";

/**
 * Founder "every morning" dashboard. Operator KPI view; pulls live counts,
 * no external analytics.
 */
export default async function FounderDashboard() {
  const { t } = await getT();
  const since30 = new Date(Date.now() - 30 * 86400000);
  const since7 = new Date(Date.now() - 7 * 86400000);

  const [
    workers,
    verifiedWorkers,
    workersWithAlerts,
    activeWorkers,
    employers,
    verifiedEmployers,
    activeEmployers,
    jobsCreated,
    jobsOpen,
    jobsFilled,
    interests,
    hires,
    completed,
    jobViews,
    notifSent,
    notifFailed,
    openReports,
    pendingVerifEmp,
    pendingVerifWorker,
    pendingDocs,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "WORKER" } }),
    prisma.workerProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.notificationPreference.count({ where: { enabled: true } }),
    prisma.jobInterest.findMany({
      where: { createdAt: { gte: since7 } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.user.count({ where: { role: "EMPLOYER" } }),
    prisma.employerProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.job.findMany({
      where: { createdAt: { gte: since30 } },
      distinct: ["employerId"],
      select: { employerId: true },
    }),
    prisma.job.count(),
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.job.count({ where: { status: "FILLED" } }),
    prisma.jobInterest.count(),
    prisma.jobInterest.count({ where: { status: "HIRED" } }),
    prisma.jobInterest.count({ where: { status: "COMPLETED" } }),
    prisma.analyticsEvent.count({ where: { type: "JOB_VIEWED" } }),
    prisma.notificationLog.count({ where: { status: { in: ["SENT", "MOCKED"] } } }),
    prisma.notificationLog.count({ where: { status: "FAILED" } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.employerProfile.count({ where: { verificationStatus: { in: ["PENDING", "NEEDS_MORE_INFO"] } } }),
    prisma.workerProfile.count({ where: { verificationStatus: { in: ["PENDING", "NEEDS_MORE_INFO"] } } }),
    prisma.verificationDocument.count({ where: { status: "PENDING", deletedAt: null } }),
  ]);

  const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");
  const interestRate = pct(interests, jobsCreated);
  const hireRate = pct(hires, interests);
  const completeRate = pct(completed, hires);

  return (
    <div>
      <PageHeader title={t("admin.fdTitle")} description={t("admin.fdDesc")} />

      {/* KPI summary */}
      <Card className="mb-6 border-primary/40 bg-orange-50/40">
        <CardHeader>
          <CardTitle className="text-lg">{t("admin.fdKpi")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><p className="text-2xl font-bold">{workers}</p><p className="text-muted-foreground">{t("admin.workers")}</p></div>
          <div><p className="text-2xl font-bold">{employers}</p><p className="text-muted-foreground">{t("admin.employers")}</p></div>
          <div><p className="text-2xl font-bold">{jobsOpen}</p><p className="text-muted-foreground">{t("admin.fdOpenJobs")}</p></div>
          <div><p className="text-2xl font-bold">{hires}</p><p className="text-muted-foreground">{t("admin.fdHires")}</p></div>
          <div><p className="text-2xl font-bold text-primary">{interestRate}</p><p className="text-muted-foreground">{t("admin.fdJobToInterest")}</p></div>
          <div><p className="text-2xl font-bold text-primary">{hireRate}</p><p className="text-muted-foreground">{t("admin.fdInterestToHire")}</p></div>
          <div><p className="text-2xl font-bold text-primary">{completeRate}</p><p className="text-muted-foreground">{t("admin.fdHireToComplete")}</p></div>
          <div>
            <p className={`text-2xl font-bold ${openReports + notifFailed > 0 ? "text-urgent" : "text-success"}`}>
              {openReports + notifFailed + pendingDocs}
            </p>
            <p className="text-muted-foreground">{t("admin.fdNeedsAttention")}</p>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t("admin.workers")}</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatsCard label={t("admin.fdTotal")} value={workers} />
        <StatsCard label={t("admin.fdVerified")} value={verifiedWorkers} accent="text-success" />
        <StatsCard label={t("admin.fdActive7")} value={activeWorkers.length} accent="text-primary" />
        <StatsCard label={t("admin.fdReceivingAlerts")} value={workersWithAlerts} />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t("admin.employers")}</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatsCard label={t("admin.fdTotal")} value={employers} />
        <StatsCard label={t("admin.fdVerified")} value={verifiedEmployers} accent="text-success" />
        <StatsCard label={t("admin.fdActive30")} value={activeEmployers.length} accent="text-primary" />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t("admin.fdSecJobs")}</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatsCard label={t("admin.fdCreated")} value={jobsCreated} />
        <StatsCard label={t("admin.fdOpen")} value={jobsOpen} />
        <StatsCard label={t("admin.fdFilled")} value={jobsFilled} />
        <StatsCard label={t("admin.fdCompleted")} value={completed} accent="text-success" />
        <StatsCard label={t("admin.fdJobViews")} value={jobViews} />
        <StatsCard label={t("admin.fdInterests")} value={interests} />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t("admin.fdSecNotif")}</h2>
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard label={t("admin.fdNotifSent")} value={notifSent} />
        <StatsCard label={t("admin.fdNotifFailed")} value={notifFailed} accent="text-urgent" />
        <StatsCard label={t("admin.fdOpenReports")} value={openReports} accent="text-urgent" />
        <StatsCard
          label={t("admin.fdPendingVerifs")}
          value={pendingVerifEmp + pendingVerifWorker + pendingDocs}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/verifications" className="text-primary underline">{t("admin.fdLinkVerifications")}</Link>
        <Link href="/admin/documents" className="text-primary underline">{t("admin.fdLinkDocuments")}</Link>
        <Link href="/admin/reports" className="text-primary underline">{t("admin.fdLinkReports")}</Link>
        <Link href="/admin/analytics" className="text-primary underline">{t("admin.fdLinkAnalytics")}</Link>
        <Link href="/admin/ops" className="text-primary underline">{t("admin.fdLinkOps")}</Link>
        <Link href="/admin/users" className="text-primary underline">{t("admin.fdLinkUserSearch")}</Link>
      </div>
    </div>
  );
}
