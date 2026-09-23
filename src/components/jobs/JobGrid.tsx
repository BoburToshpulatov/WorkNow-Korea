"use client";

import { JobCard } from "./JobCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Briefcase } from "lucide-react";
import { useT } from "@/components/LocaleProvider";
import type { JobWithEmployer } from "@/types";

export function JobGrid({
  jobs,
  hrefBase = "/worker/jobs",
  distances,
}: {
  jobs: JobWithEmployer[];
  hrefBase?: string;
  distances?: Record<string, number | null>;
}) {
  const { t } = useT();
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="h-10 w-10" />}
        title={t("jobs.none")}
        description={t("jobs.noneDesc")}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          href={`${hrefBase}/${job.id}`}
          distanceKm={distances?.[job.id]}
        />
      ))}
    </div>
  );
}
