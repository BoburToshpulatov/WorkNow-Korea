import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerifyControl } from "@/components/admin/VerifyControl";
import { formatDateTime } from "@/lib/i18n";

/** Admin user timeline / 360° view (operator tool). */
export default async function AdminUserTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale } = await getT();

  const user = await prisma.user.findUnique({
    where: { id },
    include: { workerProfile: true, employerProfile: true },
  });
  if (!user) notFound();

  const name = user.workerProfile?.name ?? user.employerProfile?.name ?? "—";
  const profile = user.workerProfile ?? user.employerProfile;

  // Build a simple chronological timeline from the user's activity.
  type Ev = { at: Date; label: string };
  const events: Ev[] = [];
  events.push({ at: user.createdAt, label: `Joined as ${user.role}` });

  if (user.employerProfile) {
    const jobs = await prisma.job.findMany({
      where: { employerId: user.employerProfile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    jobs.forEach((j) =>
      events.push({ at: j.createdAt, label: `Posted job "${j.title}" (${j.status})` })
    );
  }

  const [interests, notifs, reviewsGiven, reviewsGot, docs, reports] = await Promise.all([
    prisma.jobInterest.findMany({
      where: { userId: id },
      include: { job: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.review.count({ where: { reviewerId: id } }),
    prisma.review.aggregate({ where: { revieweeId: id }, _avg: { rating: true }, _count: true }),
    prisma.verificationDocument.findMany({ where: { ownerUserId: id, deletedAt: null }, orderBy: { uploadedAt: "desc" } }),
    prisma.report.findMany({ where: { reporterId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  interests.forEach((i) =>
    events.push({ at: i.createdAt, label: `Interest on "${i.job.title}" → ${i.status}` })
  );
  notifs.forEach((n) => events.push({ at: n.createdAt, label: `Notified: ${n.title}` }));
  docs.forEach((d) =>
    events.push({ at: d.uploadedAt, label: `Uploaded ${d.documentType} (${d.status})` })
  );
  reports.forEach((r) => events.push({ at: r.createdAt, label: `Filed report: ${r.reasonCode}` }));
  events.sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div>
      <PageHeader title={name} description={`${user.phone} · ${user.role}`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Phone: <span className="font-medium">{user.phone}</span></p>
            <p>Role: {user.role}</p>
            {profile && (
              <p className="flex items-center gap-2">
                Verification:
                {user.workerProfile && (
                  <VerifyControl target="WORKER" profileId={user.workerProfile.id} current={user.workerProfile.verificationStatus} />
                )}
                {user.employerProfile && (
                  <VerifyControl target="EMPLOYER" profileId={user.employerProfile.id} current={user.employerProfile.verificationStatus} />
                )}
              </p>
            )}
            {user.employerProfile?.flaggedForReview && (
              <Badge variant="urgent">Flagged for review</Badge>
            )}
            <p>
              Rating received:{" "}
              {reviewsGot._avg.rating != null
                ? `★ ${reviewsGot._avg.rating.toFixed(1)} (${reviewsGot._count})`
                : "—"}
            </p>
            <p>Reviews given: {reviewsGiven}</p>
            <p>Joined: {formatDateTime(user.createdAt, locale)}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              {events.slice(0, 60).map((e, i) => (
                <li key={i} className="flex gap-3 border-b pb-2 last:border-0">
                  <span className="w-40 shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(e.at, locale)}
                  </span>
                  <span>{e.label}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Link href="/admin/users" className="text-sm text-primary underline">← Back to users</Link>
      </div>
    </div>
  );
}
