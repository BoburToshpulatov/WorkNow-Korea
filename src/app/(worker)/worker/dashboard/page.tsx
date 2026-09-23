import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, Bookmark, Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobGrid } from "@/components/jobs/JobGrid";
import { AvailabilitySelector } from "@/components/worker/AvailabilitySelector";
import { buildJobWhereClause } from "@/lib/matching";
import type { CategoryValue } from "@/lib/constants";

export default async function WorkerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { t } = await getT();

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const completeness = profile
    ? Math.round(
        ([
          profile.name,
          profile.preferredCity,
          profile.languages.length > 0,
          profile.categories.length > 0,
          profile.availability.length > 0,
          profile.bio,
        ].filter(Boolean).length /
          6) *
          100
      )
    : 0;

  const where = buildJobWhereClause({
    city: profile?.preferredCity,
    district: profile?.preferredDistrict ?? undefined,
    categories: (profile?.categories as CategoryValue[]) ?? undefined,
    languages: profile?.languages,
  });

  const [nearbyCount, recentJobs, savedCount] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      include: { employer: true },
      orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.savedJob.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("worker.greeting", { name: profile ? t("worker.greetingNameSuffix", { name: profile.name }) : "" })}
        description={t("worker.dashboardDesc")}
        action={
          <Button asChild>
            <Link href="/worker/jobs">{t("worker.browseJobs")}</Link>
          </Button>
        }
      />

      {profile && (
        <div className="mb-6">
          <AvailabilitySelector current={profile.availabilityStatus} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label={t("worker.profileComplete")} value={`${completeness}%`} />
        <StatsCard
          label={t("worker.nearbyJobs")}
          value={nearbyCount}
          icon={Briefcase}
          accent="text-success"
        />
        <StatsCard
          label={t("worker.savedJobs")}
          value={savedCount}
          icon={Bookmark}
          accent="text-secondary"
        />
      </div>

      {completeness < 100 && (
        <Card className="mt-6 border-primary/40 bg-orange-50">
          <CardContent className="flex items-center justify-between p-5">
            <p className="text-sm">
              {t("worker.completeProfilePrompt")}
            </p>
            <Button size="sm" asChild>
              <Link href="/worker/profile">{t("worker.finishProfile")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/worker/saved">
            <Bookmark className="h-4 w-4" /> {t("nav.saved")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/worker/notifications">
            <Bell className="h-4 w-4" /> {t("notifications.title")}
          </Link>
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("worker.recentMatches")}</CardTitle>
        </CardHeader>
        <CardContent>
          <JobGrid jobs={recentJobs} />
        </CardContent>
      </Card>
    </div>
  );
}
