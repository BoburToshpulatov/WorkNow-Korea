import Link from "next/link";
import {
  Users,
  Briefcase,
  HardHat,
  ShieldAlert,
  Heart,
  CheckCircle2,
  Flag,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import type { JobStatus } from "@prisma/client";

export default async function AdminDashboard() {
  const [
    users,
    employers,
    workers,
    jobsByStatus,
    openJobs,
    interests,
    hires,
    reports,
    pendingJobs,
    pendingReports,
    unverifiedEmployers,
    pendingWorkerVerif,
    pendingDocs,
    rejectedDocs,
    flaggedEmployers,
    failedNotifs,
    ratingAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "EMPLOYER" } }),
    prisma.user.count({ where: { role: "WORKER" } }),
    prisma.job.groupBy({ by: ["status"], _count: true }),
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.jobInterest.count(),
    prisma.jobInterest.count({ where: { status: "HIRED" } }),
    prisma.report.count(),
    prisma.job.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.employerProfile.count({
      where: { verificationStatus: { in: ["PENDING", "NEEDS_MORE_INFO"] } },
    }),
    prisma.workerProfile.count({
      where: { verificationStatus: { in: ["PENDING", "NEEDS_MORE_INFO"] } },
    }),
    prisma.verificationDocument.count({ where: { status: "PENDING" } }),
    prisma.verificationDocument.count({ where: { status: "REJECTED" } }),
    prisma.employerProfile.count({ where: { flaggedForReview: true } }),
    prisma.notificationLog.count({ where: { status: "FAILED" } }),
    prisma.review.aggregate({ _avg: { rating: true } }),
  ]);

  const statusMap = new Map<JobStatus, number>();
  for (const row of jobsByStatus) statusMap.set(row.status, row._count);
  const avgRating = ratingAgg._avg.rating;
  const { t } = await getT();

  return (
    <div>
      <PageHeader title={t("admin.overviewTitle")} description={t("admin.overviewDesc")} />

      {/* Core pilot metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label={t("admin.workers")} value={workers} icon={HardHat} accent="text-success" />
        <StatsCard label={t("admin.employers")} value={employers} icon={Briefcase} accent="text-secondary" />
        <StatsCard label={t("admin.openJobs")} value={openJobs} icon={ShieldAlert} accent="text-primary" />
        <StatsCard label={t("admin.totalUsers")} value={users} icon={Users} />
        <StatsCard label={t("admin.interests")} value={interests} icon={Heart} accent="text-primary" />
        <StatsCard label={t("admin.hires")} value={hires} icon={CheckCircle2} accent="text-success" />
        <StatsCard label={t("admin.reports")} value={reports} icon={Flag} accent="text-urgent" />
        <StatsCard label={t("admin.pendingJobsStat")} value={pendingJobs} icon={Clock} />
      </div>

      {/* Trust & safety metrics (this phase) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("admin.trustMetrics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link href="/admin/verifications" className="rounded-lg border p-3 hover:bg-accent">
              <p className="text-2xl font-bold text-primary">{unverifiedEmployers}</p>
              <p className="text-xs text-muted-foreground">{t("admin.pendingEmpVerif")}</p>
            </Link>
            <Link href="/admin/verifications" className="rounded-lg border p-3 hover:bg-accent">
              <p className="text-2xl font-bold text-primary">{pendingWorkerVerif}</p>
              <p className="text-xs text-muted-foreground">{t("admin.pendingWorkerVerif")}</p>
            </Link>
            <Link href="/admin/documents" className="rounded-lg border p-3 hover:bg-accent">
              <p className="text-2xl font-bold text-primary">{pendingDocs}</p>
              <p className="text-xs text-muted-foreground">{t("admin.pendingDocs")}</p>
            </Link>
            <Link href="/admin/documents" className="rounded-lg border p-3 hover:bg-accent">
              <p className="text-2xl font-bold text-urgent">{rejectedDocs}</p>
              <p className="text-xs text-muted-foreground">{t("admin.rejectedDocs")}</p>
            </Link>
            <Link href="/admin/reports" className="rounded-lg border p-3 hover:bg-accent">
              <p className="text-2xl font-bold text-urgent">{pendingReports}</p>
              <p className="text-xs text-muted-foreground">{t("admin.pendingReports")}</p>
            </Link>
            <Link href="/admin/users" className="rounded-lg border p-3 hover:bg-accent">
              <p className="text-2xl font-bold">{flaggedEmployers}</p>
              <p className="text-xs text-muted-foreground">{t("admin.usersNeedingReview")}</p>
            </Link>
            <Link href="/admin/notifications" className="rounded-lg border p-3 hover:bg-accent">
              <p className="text-2xl font-bold text-urgent">{failedNotifs}</p>
              <p className="text-xs text-muted-foreground">{t("admin.notifTitle")}</p>
            </Link>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold text-success">
                {avgRating != null ? `★ ${avgRating.toFixed(1)}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">{t("admin.avgPlatformRating")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moderation queue */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("admin.moderationQueue")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/admin/jobs"
              className="rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <p className="text-2xl font-bold text-primary">{pendingJobs}</p>
              <p className="text-sm text-muted-foreground">{t("admin.pendingJobs")}</p>
            </Link>
            <Link
              href="/admin/reports"
              className="rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <p className="text-2xl font-bold text-urgent">{pendingReports}</p>
              <p className="text-sm text-muted-foreground">{t("admin.pendingReports")}</p>
            </Link>
            <Link
              href="/admin/users"
              className="rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <p className="text-2xl font-bold">{unverifiedEmployers}</p>
              <p className="text-sm text-muted-foreground">{t("admin.unverifiedEmployers")}</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Jobs by status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("admin.jobsByStatus")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((status) => (
              <div key={status} className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{statusMap.get(status) ?? 0}</p>
                <p className="text-xs text-muted-foreground">
                  {t(`enums.jobStatus.${status}`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
