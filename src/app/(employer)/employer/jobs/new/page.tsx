import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/getT";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/PageHeader";
import { JobForm } from "@/components/jobs/JobForm";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { JobInput } from "@/lib/validations";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { t } = await getT();
  const { from } = await searchParams;

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!employer) {
    return (
      <EmptyState
        title={t("employer.setupProfileTitle")}
        description={t("employer.setupProfileDesc")}
        action={
          <Button asChild>
            <Link href="/employer/profile">{t("employer.setupProfile")}</Link>
          </Button>
        }
      />
    );
  }

  // Repost (Phase 5): prefill from a previous job the employer owns.
  let defaults: Partial<JobInput> = {
    contactPhone: session.user.phone ?? "",
    city: employer.city,
  };
  let reposted = false;
  if (from) {
    const src = await prisma.job.findUnique({ where: { id: from } });
    if (src && src.employerId === employer.id) {
      reposted = true;
      defaults = {
        title: src.title,
        category: src.category,
        description: src.description,
        address: src.address,
        province: src.province ?? employer.city,
        city: src.city,
        district: src.district ?? "",
        region: src.region,
        durationType: src.durationType,
        durationDetails: src.durationDetails,
        workersNeeded: src.workersNeeded,
        salaryAmount: src.salaryAmount,
        salaryType: src.salaryType,
        paymentTiming: src.paymentTiming,
        requiredSkills: src.requiredSkills,
        languagePreference: src.languagePreference,
        visaNote: src.visaNote ?? "",
        contactPhone: src.contactPhone,
        kakaoId: src.kakaoId ?? "",
        isUrgent: src.isUrgent,
        safetyNotes: src.safetyNotes ?? "",
      };
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={t("employer.postTitle")}
        description={t("employer.postDesc")}
      />
      {reposted && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {t("employer.repostConfirm")}
        </div>
      )}
      <JobForm defaultValues={defaults} />
    </div>
  );
}
