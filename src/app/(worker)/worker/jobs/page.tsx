import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/common/PageHeader";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobGrid } from "@/components/jobs/JobGrid";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  buildJobWhereClause,
  isNightJob,
  sortJobs,
  type JobSort,
} from "@/lib/matching";
import { distanceBetween } from "@/lib/distance";
import type { CategoryValue } from "@/lib/constants";
import { getT } from "@/lib/getT";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

async function JobResults({
  searchParams,
  workerId,
}: {
  searchParams: Record<string, string | undefined>;
  workerId: string;
}) {
  const { t } = await getT();
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
  if (searchParams.salaryType) {
    (where as Prisma.JobWhereInput).salaryType =
      searchParams.salaryType as never;
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
      // Filters below (distance, night) and sorting run in memory, so fetch a
      // generous window and paginate after. Fine at pilot scale (one district).
      take: 500,
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
          job,
        )
      : null;
    distances[job.id] = km;
    return { ...job, distanceKm: km };
  });

  if (searchParams.quick === "night") {
    jobs = jobs.filter(isNightJob);
  }

  // Distance filter (only meaningful with a location).
  const within = Number(searchParams.within);
  if (hasLocation && within > 0) {
    jobs = jobs.filter((j) => j.distanceKm != null && j.distanceKm <= within); // i18n-ignore
  }

  // Sort. "nearest" falls back to "newest" when no location is set.
  let sort = (searchParams.sort as JobSort) || "urgent";
  if (sort === "nearest" && !hasLocation) sort = "newest";
  jobs = sortJobs(jobs, sort);

  const page = Math.max(1, Math.floor(Number(searchParams.page)) || 1);
  const shown = jobs.slice(0, page * PAGE_SIZE);
  const moreParams = new URLSearchParams(
    Object.entries(searchParams).filter(([, v]) => v != null) as [
      string,
      string,
    ][],
  );
  moreParams.set("page", String(page + 1));

  return (
    <div className="space-y-4">
      {jobs.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {t("jobs.resultCount", { count: jobs.length })}
        </p>
      )}
      <JobGrid jobs={shown} distances={distances} />
      {shown.length < jobs.length && (
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href={`?${moreParams.toString()}`} scroll={false}>
              {t("jobs.loadMore")}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
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
      <PageHeader
        title={t("jobs.feedTitle")}
        description={t("jobs.feedDesc")}
      />
      <JobFilters hasLocation={hasLocation} />
      <div className="mt-6">
        <Suspense
          key={JSON.stringify({ ...sp, page: undefined })}
          fallback={<LoadingSpinner />}
        >
          <JobResults searchParams={sp} workerId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
