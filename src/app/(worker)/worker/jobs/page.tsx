import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/common/PageHeader";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobGrid } from "@/components/jobs/JobGrid";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { buildJobWhereClause } from "@/lib/matching";
import type { CategoryValue } from "@/lib/constants";
import { getT } from "@/lib/getT";

async function JobResults({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
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

  const jobs = await prisma.job.findMany({
    where,
    include: { employer: true },
    orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  return <JobGrid jobs={jobs} />;
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

  return (
    <div>
      <PageHeader title={t("jobs.feedTitle")} description={t("jobs.feedDesc")} />
      <JobFilters />
      <div className="mt-6">
        <Suspense key={JSON.stringify(sp)} fallback={<LoadingSpinner />}>
          <JobResults searchParams={sp} />
        </Suspense>
      </div>
    </div>
  );
}
