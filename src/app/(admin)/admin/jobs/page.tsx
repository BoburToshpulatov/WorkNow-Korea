import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { JobTable } from "@/components/admin/JobTable";

export default async function AdminJobsPage() {
  const jobs = await prisma.job.findMany({
    include: { employer: true },
    orderBy: { createdAt: "desc" },
  });
  const { t } = await getT();

  return (
    <div>
      <PageHeader
        title={t("admin.jobsTitle")}
        description={t("admin.jobsDesc")}
      />
      <JobTable jobs={jobs} />
    </div>
  );
}
