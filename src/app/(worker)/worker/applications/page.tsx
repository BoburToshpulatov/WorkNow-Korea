import Link from "next/link";
import { redirect } from "next/navigation";
import { Phone, MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/getT";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatJobSalary, formatDateTime } from "@/lib/i18n";
import { ReviewForm } from "@/components/reviews/ReviewForm";

export default async function MyApplicationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { t, locale } = await getT();

  const apps = await prisma.jobInterest.findMany({
    where: { userId: session.user.id },
    include: { job: { include: { employer: true } } },
    orderBy: { updatedAt: "desc" },
  });

  // Jobs this worker has already reviewed.
  const myReviews = await prisma.review.findMany({
    where: { reviewerId: session.user.id },
    select: { jobId: true },
  });
  const reviewedJobs = new Set(myReviews.map((r) => r.jobId));

  return (
    <div>
      <PageHeader title={t("ts.myAppsTitle")} description={t("ts.myAppsDesc")} />

      {apps.length === 0 ? (
        <EmptyState title={t("ts.noApps")} description={t("ts.noAppsDesc")} />
      ) : (
        <div className="space-y-3">
          {apps.map((a) => {
            const job = a.job;
            const tel = `tel:${job.contactPhone.replace(/[^0-9+]/g, "")}`;
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/worker/jobs/${job.id}`}
                        className="font-semibold hover:text-primary"
                      >
                        {job.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {job.employer.name} · {job.city}
                        {job.district ? ` ${job.district}` : ""}
                      </p>
                    </div>
                    <Badge variant={a.status === "HIRED" ? "success" : "muted"}>
                      {t(`applicantStatus.${a.status}`)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-semibold text-success">
                      {formatJobSalary(job.salaryAmount, job.salaryType, locale)}
                    </span>
                    <span>{formatDateTime(job.startDateTime, locale)}</span>
                  </div>

                  <div className="flex gap-2 border-t pt-3">
                    <Button asChild size="sm" variant="secondary">
                      <a href={tel}>
                        <Phone className="h-3.5 w-3.5" /> {t("common.call")}
                      </a>
                    </Button>
                    {job.kakaoId && (
                      <Button asChild size="sm" variant="outline">
                        <a
                          href="https://open.kakao.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> {job.kakaoId}
                        </a>
                      </Button>
                    )}
                  </div>

                  {a.status === "COMPLETED" && (
                    <div className="border-t pt-3">
                      <ReviewForm
                        jobId={job.id}
                        revieweeId={job.employer.userId}
                        label={t("ts.reviewEmployer")}
                        alreadyReviewed={reviewedJobs.has(job.id)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
