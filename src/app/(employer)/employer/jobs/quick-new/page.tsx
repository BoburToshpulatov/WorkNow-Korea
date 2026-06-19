import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/getT";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/PageHeader";
import { QuickJobForm } from "@/components/jobs/QuickJobForm";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default async function QuickNewJobPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { t } = await getT();

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

  return (
    <div>
      <PageHeader
        title={t("employer.quickPost")}
        description={t("employer.quickPostDesc")}
      />
      <QuickJobForm
        defaultPhone={session.user.phone ?? ""}
        defaultCity={employer.city}
      />
    </div>
  );
}
