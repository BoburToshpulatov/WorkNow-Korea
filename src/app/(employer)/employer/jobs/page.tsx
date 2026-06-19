import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Users, PlusCircle, Copy, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobStatus } from "@/components/jobs/JobStatus";
import { EmptyState } from "@/components/common/EmptyState";
import { CancelJobButton } from "./CancelJobButton";
import { formatJobSalary, formatDateTime } from "@/lib/i18n";

export default async function MyJobsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      jobs: {
        include: { _count: { select: { interests: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const jobs = employer?.jobs ?? [];
  const { t, locale } = await getT();

  return (
    <div>
      <PageHeader
        title={t("employer.myJobs")}
        description={t("employer.myJobsDesc")}
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

      {jobs.length === 0 ? (
        <EmptyState
          title={t("employer.noJobs")}
          action={
            <Button asChild>
              <Link href="/employer/jobs/new">{t("employer.postFirst")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{job.title}</h3>
                    <JobStatus status={job.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatJobSalary(job.salaryAmount, job.salaryType, locale)} ·{" "}
                    {t("employer.interestedCount", { count: job._count.interests })} ·{" "}
                    {formatDateTime(job.createdAt, locale)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/employer/jobs/${job.id}/applicants`}>
                      <Users className="h-4 w-4" /> {t("nav.applicants") !== "nav.applicants" ? t("nav.applicants") : t("employer.applicantsTitle")}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/employer/jobs/${job.id}/edit`}>
                      <Pencil className="h-4 w-4" /> {t("common.edit")}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/employer/jobs/new?from=${job.id}`}>
                      <Copy className="h-4 w-4" /> {t("employer.repost")}
                    </Link>
                  </Button>
                  {job.status !== "CANCELLED" && (
                    <CancelJobButton jobId={job.id} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
