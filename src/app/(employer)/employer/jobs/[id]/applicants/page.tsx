import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/getT";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/PageHeader";
import { ApplicantCard } from "@/components/employer/ApplicantCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Disclaimer } from "@/components/common/Disclaimer";
import { getWorkerStats, workerTier } from "@/lib/trust";

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { t } = await getT();

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      employer: true,
      interests: {
        include: { user: { include: { workerProfile: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) notFound();
  if (job.employer.userId !== session.user.id) redirect("/employer/jobs");

  // Compute a simple trust tier + stats per applicant (pilot scale is small).
  const trust = await Promise.all(
    job.interests.map(async (i) => {
      const stats = await getWorkerStats(i.userId);
      return { id: i.id, tier: workerTier(stats), stats };
    })
  );
  const trustById = new Map(trust.map((tr) => [tr.id, tr]));

  // Which workers this employer has already reviewed for this job.
  const myReviews = await prisma.review.findMany({
    where: { jobId: job.id, reviewerId: session.user.id },
    select: { revieweeId: true },
  });
  const reviewed = new Set(myReviews.map((r) => r.revieweeId));

  return (
    <div>
      <PageHeader
        title={t("employer.applicantsTitle")}
        description={t("employer.applicantsCount", { title: job.title, count: job.interests.length })}
      />

      {job.interests.length === 0 ? (
        <EmptyState
          title={t("employer.noApplicants")}
          description={t("employer.noApplicantsDesc")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {job.interests.map((interest) => {
            const tr = trustById.get(interest.id);
            return (
              <ApplicantCard
                key={interest.id}
                applicant={interest}
                jobId={job.id}
                tier={tr?.tier ?? "NEW"}
                completedJobs={tr?.stats.completedJobs ?? 0}
                noShowCount={tr?.stats.noShowCount ?? 0}
                joinedAt={tr?.stats.joinedAt ?? interest.createdAt}
                avgRating={tr?.stats.avgRating ?? null}
                reviewCount={tr?.stats.reviewCount ?? 0}
                alreadyReviewed={reviewed.has(interest.userId)}
              />
            );
          })}
        </div>
      )}

      <Disclaimer className="mt-8" />
    </div>
  );
}
