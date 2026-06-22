import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/common/PageHeader";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobGrid } from "@/components/jobs/JobGrid";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { buildJobWhereClause, sortJobs, type JobSort } from "@/lib/matching";
import { distanceBetween } from "@/lib/distance";
import type { CategoryValue } from "@/lib/constants";
import { getT } from "@/lib/getT";

async function JobResults({
  searchParams,
  workerId,
}: {
  searchParams: Record<string, string | undefined>;
  workerId: string;
}) {
  const where = buildJobWhereClause({
    city: searchParams.city,
    categories: searchParams.category
      ? [searchParams.category as CategoryValue]
      : undefined,
    urgentOnly: searchParams.quick === "urgent",
    language: searchParams.language,
  });

  if (searchParams.quick === "sameDayPay") {
    (where as Prisma.JobWhereInput).paymentTiming = "SAME_DAY";
  }
  if (searchParams.quick === "night") {
    (where as Prisma.JobWhereInput).durationDetails = {
      contains: "night",
      mode: "insensitive",
    };
  }
  if (searchParams.salaryType) {
    (where as Prisma.JobWhereInput).salaryType = searchParams.salaryType as never;
  }
  if (searchParams.paymentTiming) {
    (where as Prisma.JobWhereInput).paymentTiming =
      searchParams.paymentTiming as never;
  }

  const [profile, rows] = await Promise.all([
    prisma.workerProfile.findUnique({
      where: { userId: workerId },
      select: { currentLatitude: true, currentLongitude: true },
    }),
    prisma.job.findMany({
      where,
      include: { employer: true },
      orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
  ]);

  const hasLocation =
    profile?.currentLatitude != null && profile?.currentLongitude != null;

  // Compute per-job distance when the worker has a saved location.
  const distances: Record<string, number | null> = {};
  let jobs = rows.map((job) => {
    const km = hasLocation
      ? distanceBetween(
          {
            latitude: profile!.currentLatitude,
            longitude: profile!.currentLongitude,
          },
          job
        )
      : null;
    distances[job.id] = km;
    return { ...job, distanceKm: km };
  });

  // Distance filter (only meaningful with a location).
  const within = Number(searchParams.within);
  if (hasLocation && within > 0) {
    jobs = jobs.filter((j) => j.distanceKm != null && j.distanceKm <= within);
  }

  // Sort. "nearest" falls back to "newest" when no location is set.
  let sort = (searchParams.sort as JobSort) || "urgent";
  if (sort === "nearest" && !hasLocation) sort = "newest";
  jobs = sortJobs(jobs, sort);

  return <JobGrid jobs={jobs.slice(0, 60)} distances={distances} />;
}

export default async function WorkerJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;
  const { t } = await getT();

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    select: { currentLatitude: true, currentLongitude: true },
  });
  const hasLocation =
    profile?.currentLatitude != null && profile?.currentLongitude != null;

  return (
    <div>
      <PageHeader title={t("jobs.feedTitle")} description={t("jobs.feedDesc")} />
      <JobFilters hasLocation={hasLocation} />
      <div className="mt-6">
        <Suspense key={JSON.stringify(sp)} fallback={<LoadingSpinner />}>
          <JobResults searchParams={sp} workerId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
