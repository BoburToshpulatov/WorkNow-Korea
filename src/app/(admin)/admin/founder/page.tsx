import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Founder "every morning" dashboard. Operator-only KPI view (English labels —
 * this is an internal tool). Pulls live counts; no external analytics.
 */
export default async function FounderDashboard() {
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
      <PageHeader title="Founder dashboard" description="Daily pilot health at a glance." />

      {/* KPI summary */}
      <Card className="mb-6 border-primary/40 bg-orange-50/40">
        <CardHeader>
          <CardTitle className="text-lg">KPI summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><p className="text-2xl font-bold">{workers}</p><p className="text-muted-foreground">Workers</p></div>
          <div><p className="text-2xl font-bold">{employers}</p><p className="text-muted-foreground">Employers</p></div>
          <div><p className="text-2xl font-bold">{jobsOpen}</p><p className="text-muted-foreground">Open jobs</p></div>
          <div><p className="text-2xl font-bold">{hires}</p><p className="text-muted-foreground">Hires</p></div>
          <div><p className="text-2xl font-bold text-primary">{interestRate}</p><p className="text-muted-foreground">Job→Interest</p></div>
          <div><p className="text-2xl font-bold text-primary">{hireRate}</p><p className="text-muted-foreground">Interest→Hire</p></div>
          <div><p className="text-2xl font-bold text-primary">{completeRate}</p><p className="text-muted-foreground">Hire→Complete</p></div>
          <div>
            <p className={`text-2xl font-bold ${openReports + notifFailed > 0 ? "text-urgent" : "text-success"}`}>
              {openReports + notifFailed + pendingDocs}
            </p>
            <p className="text-muted-foreground">Needs attention</p>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Workers</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatsCard label="Total" value={workers} />
        <StatsCard label="Verified" value={verifiedWorkers} accent="text-success" />
        <StatsCard label="Active (7d)" value={activeWorkers.length} accent="text-primary" />
        <StatsCard label="Receiving alerts" value={workersWithAlerts} />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Employers</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatsCard label="Total" value={employers} />
        <StatsCard label="Verified" value={verifiedEmployers} accent="text-success" />
        <StatsCard label="Active (30d)" value={activeEmployers.length} accent="text-primary" />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Jobs & marketplace</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatsCard label="Created" value={jobsCreated} />
        <StatsCard label="Open" value={jobsOpen} />
        <StatsCard label="Filled" value={jobsFilled} />
        <StatsCard label="Completed" value={completed} accent="text-success" />
        <StatsCard label="Job views" value={jobViews} />
        <StatsCard label="Interests" value={interests} />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Notifications & trust</h2>
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard label="Notif sent" value={notifSent} />
        <StatsCard label="Notif failed" value={notifFailed} accent="text-urgent" />
        <StatsCard label="Open reports" value={openReports} accent="text-urgent" />
        <StatsCard
          label="Pending verifications"
          value={pendingVerifEmp + pendingVerifWorker + pendingDocs}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/verifications" className="text-primary underline">Verifications</Link>
        <Link href="/admin/documents" className="text-primary underline">Documents</Link>
        <Link href="/admin/reports" className="text-primary underline">Reports</Link>
        <Link href="/admin/analytics" className="text-primary underline">Analytics</Link>
        <Link href="/admin/ops" className="text-primary underline">Ops & exports</Link>
        <Link href="/admin/users" className="text-primary underline">User search</Link>
      </div>
    </div>
  );
}
