import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/getT";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/PageHeader";
import { JobGrid } from "@/components/jobs/JobGrid";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { t } = await getT();

  const [saved, interested] = await Promise.all([
    prisma.savedJob.findMany({
      where: { userId: session.user.id },
      include: { job: { include: { employer: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobInterest.findMany({
      where: { userId: session.user.id },
      include: { job: { include: { employer: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("worker.savedTitle")}
        description={t("worker.savedDesc")}
      />
      <Tabs defaultValue="saved">
        <TabsList>
          <TabsTrigger value="saved">{t("worker.tabSaved")} ({saved.length})</TabsTrigger>
          <TabsTrigger value="interested">
            {t("worker.tabInterested")} ({interested.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="saved" className="mt-4">
          <JobGrid jobs={saved.map((s) => s.job)} />
        </TabsContent>
        <TabsContent value="interested" className="mt-4">
          <JobGrid jobs={interested.map((i) => i.job)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
