import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/getT";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/PageHeader";
import { JobForm } from "@/components/jobs/JobForm";

export default async function EditJobPage({
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
    include: { employer: true },
  });

  if (!job) notFound();
  if (job.employer.userId !== session.user.id) redirect("/employer/jobs");

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("employer.editTitle")} />
      <JobForm
        jobId={job.id}
        defaultValues={{
          title: job.title,
          category: job.category,
          description: job.description,
          address: job.address,
          city: job.city,
          region: job.region,
          latitude: job.latitude,
          longitude: job.longitude,
          startDateTime: job.startDateTime,
          durationType: job.durationType,
          durationDetails: job.durationDetails,
          workersNeeded: job.workersNeeded,
          salaryAmount: job.salaryAmount,
          salaryType: job.salaryType,
          paymentTiming: job.paymentTiming,
          requiredSkills: job.requiredSkills,
          languagePreference: job.languagePreference,
          visaNote: job.visaNote ?? "",
          contactPhone: job.contactPhone,
          kakaoId: job.kakaoId ?? "",
          isUrgent: job.isUrgent,
          safetyNotes: job.safetyNotes ?? "",
        }}
      />
    </div>
  );
}
