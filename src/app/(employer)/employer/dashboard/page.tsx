import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks, Users, Eye, PlusCircle, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobStatus } from "@/components/jobs/JobStatus";
import { EmptyState } from "@/components/common/EmptyState";
import { NotificationInbox } from "@/components/notifications/NotificationInbox";
import { formatJobSalary } from "@/lib/i18n";

export default async function EmployerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { t, locale } = await getT();

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      jobs: {
        include: { _count: { select: { interests: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!employer) {
    return (
      <EmptyState
        title={t("employer.setupProfileTitle")}
        description={t("employer.setupProfileDesc")}
        action={
          <Button asChild>
            <Link href="/employer/profile">{t("employer.setupProfile")}</Link>
          </Button>
        }
      />
    );
  }

  const jobs = employer.jobs;
  const openCount = jobs.filter((j) => j.status === "OPEN").length;
  const applicants = jobs.reduce((sum, j) => sum + j._count.interests, 0);

  return (
    <div>
      <PageHeader
        title={t("employer.welcome", { name: employer.name })}
        description={t("employer.dashboardDesc")}
        action={
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/employer/jobs/quick-new">
                <Zap className="h-4 w-4" /> {t("employer.quickPost")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/employer/jobs/new">
                <PlusCircle className="h-4 w-4" /> {t("employer.postNewJob")}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label={t("employer.totalJobs")} value={jobs.length} icon={ListChecks} />
        <StatsCard label={t("employer.openJobs")} value={openCount} icon={Eye} accent="text-success" />
        <StatsCard label={t("employer.totalApplicants")} value={applicants} icon={Users} accent="text-secondary" />
      </div>

      <div className="mt-6">
        <NotificationInbox />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("employer.recentJobs")}</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <EmptyState
              title={t("employer.noJobs")}
              description={t("employer.noJobsDesc")}
              action={
                <Button asChild>
                  <Link href="/employer/jobs/new">{t("nav.postJob")}</Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <Link
                      href={`/employer/jobs/${job.id}/applicants`}
                      className="font-medium hover:text-primary"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatJobSalary(job.salaryAmount, job.salaryType, locale)} ·{" "}
                      {t("employer.interestedCount", { count: job._count.interests })}
                    </p>
                  </div>
                  <JobStatus status={job.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
