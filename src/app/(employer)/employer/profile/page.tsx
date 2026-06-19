import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/getT";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/PageHeader";
import { EmployerProfileForm } from "@/components/employer/EmployerProfileForm";
import { Card, CardContent } from "@/components/ui/card";

export default async function EmployerProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { t } = await getT();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={t("employer.profileTitle")}
        description={t("employer.profileDesc")}
      />
      <Card>
        <CardContent className="pt-6">
          <EmployerProfileForm
            verificationStatus={profile?.verificationStatus ?? "UNVERIFIED"}
            verificationNote={profile?.verificationNote}
            defaultValues={
              profile
                ? {
                    name: profile.name,
                    businessType: profile.businessType,
                    city: profile.city,
                    province: profile.province ?? profile.city,
                    district: profile.district ?? "",
                    representativeName: profile.representativeName ?? "",
                    businessAddress: profile.businessAddress ?? "",
                    businessRegistrationNumber:
                      profile.businessRegistrationNumber ?? "",
                    bio: profile.bio ?? "",
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
