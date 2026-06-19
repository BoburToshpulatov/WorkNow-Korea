import { JobCard } from "./JobCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Briefcase } from "lucide-react";
import type { JobWithEmployer } from "@/types";

export function JobGrid({
  jobs,
  hrefBase = "/worker/jobs",
}: {
  jobs: JobWithEmployer[];
  hrefBase?: string;
}) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="h-10 w-10" />}
        title="일자리가 없습니다"
        description="필터를 변경하거나 잠시 후 다시 확인해 주세요. 매일 새로운 일자리가 등록됩니다."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} href={`${hrefBase}/${job.id}`} />
      ))}
    </div>
  );
}
