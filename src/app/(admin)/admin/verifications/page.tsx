import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { VerificationReviewCard } from "@/components/admin/VerificationReviewCard";

const REVIEW_STATES = ["PENDING", "NEEDS_MORE_INFO"] as const;

export default async function AdminVerificationsPage() {
  const { t } = await getT();

  const [employers, workers] = await Promise.all([
    prisma.employerProfile.findMany({
      where: { verificationStatus: { in: [...REVIEW_STATES] } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workerProfile.findMany({
      where: { verificationStatus: { in: [...REVIEW_STATES] } },
      include: { user: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("ts.verifQueueTitle")}
        description={t("ts.verifQueueDesc")}
      />

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">{t("ts.tabEmployers")}</h2>
        {employers.length === 0 ? (
          <EmptyState title={t("ts.noPending")} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {employers.map((e) => (
              <VerificationReviewCard
                key={e.id}
                target="EMPLOYER"
                profileId={e.id}
                name={e.name}
                status={e.verificationStatus}
                fields={[
                  { label: t("employer.bizType"), value: e.businessType },
                  { label: t("ts.repName"), value: e.representativeName ?? "" },
                  { label: t("employer.brn"), value: e.businessRegistrationNumber ?? "" },
                  { label: t("ts.bizAddress"), value: e.businessAddress ?? e.city },
                ]}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("ts.tabWorkers")}</h2>
        {workers.length === 0 ? (
          <EmptyState title={t("ts.noPending")} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {workers.map((w) => (
              <VerificationReviewCard
                key={w.id}
                target="WORKER"
                profileId={w.id}
                name={w.name}
                status={w.verificationStatus}
                fields={[
                  { label: t("admin.colPhone"), value: w.user.phone },
                  { label: t("ts.nationality"), value: w.nationality ?? "" },
                  {
                    label: t("ts.visaCategory"),
                    value: w.visaCategory ? t(`visa.${w.visaCategory}`) : "",
                  },
                  { label: t("common.languages"), value: w.languages.join(", ") },
                ]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
