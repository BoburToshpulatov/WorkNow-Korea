import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/getT";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/PageHeader";
import { WorkerProfileForm } from "@/components/worker/WorkerProfileForm";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkerProfileInput } from "@/lib/validations";

export default async function WorkerProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { t } = await getT();

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const defaults: Partial<WorkerProfileInput> | undefined = profile
    ? {
        name: profile.name,
        preferredCity: profile.preferredCity,
        preferredProvince: profile.preferredProvince ?? profile.preferredCity,
        preferredDistrict: profile.preferredDistrict ?? "",
        preferredRadius: profile.preferredRadius,
        languages: profile.languages,
        categories: profile.categories,
        availability: profile.availability,
        transport: profile.transport,
        experience: profile.experience ?? "",
        visaNote: profile.visaNote ?? "",
        nationality: profile.nationality ?? "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        visaCategory: (profile.visaCategory ?? "") as any,
        bio: profile.bio ?? "",
      }
    : undefined;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={t("worker.profileTitle")}
        description={t("worker.profileDesc")}
      />
      <Card>
        <CardContent className="pt-6">
          <WorkerProfileForm
            defaultValues={defaults}
            verificationStatus={profile?.verificationStatus ?? "UNVERIFIED"}
            verificationNote={profile?.verificationNote}
          />
        </CardContent>
      </Card>
    </div>
  );
}
