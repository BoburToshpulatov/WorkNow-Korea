import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { RehireList, type RehireWorker } from "@/components/employer/RehireList";

export default async function EmployerRehirePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "EMPLOYER") redirect("/");
  const { t } = await getT();

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!employer) redirect("/employer/profile");

  // Workers who COMPLETED at least one of this employer's jobs.
  const completions = await prisma.jobInterest.findMany({
    where: { status: "COMPLETED", job: { employerId: employer.id } },
    include: {
      user: { include: { workerProfile: true } },
      job: { select: { title: true, startDateTime: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Aggregate per worker.
  const byWorker = new Map<string, RehireWorker>();
  for (const c of completions) {
    const existing = byWorker.get(c.userId);
    const worked = c.job.startDateTime.toISOString();
    if (existing) {
      existing.completedTogether += 1;
      if (!existing.lastWorked || worked > existing.lastWorked) {
        existing.lastWorked = worked;
      }
    } else {
      byWorker.set(c.userId, {
        userId: c.userId,
        name: c.user.workerProfile?.name ?? t("enums.role.WORKER"),
        completedTogether: 1,
        lastWorked: worked,
        avgRating: null,
        reviewCount: 0,
      });
    }
  }

  // Ratings for these workers (as reviewees).
  const ids = Array.from(byWorker.keys());
  if (ids.length) {
    const ratings = await prisma.review.groupBy({
      by: ["revieweeId"],
      where: { revieweeId: { in: ids } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    for (const r of ratings) {
      const w = byWorker.get(r.revieweeId);
      if (w) {
        w.avgRating = r._avg.rating;
        w.reviewCount = r._count.rating;
      }
    }
  }

  const openJobs = await prisma.job.findMany({
    where: { employerId: employer.id, status: "OPEN" },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title={t("match.rehireTitle")} description={t("match.rehireDesc")} />
      <RehireList workers={Array.from(byWorker.values())} openJobs={openJobs} />
    </div>
  );
}
