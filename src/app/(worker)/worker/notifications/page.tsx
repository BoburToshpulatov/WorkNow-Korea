import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/getT";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/PageHeader";
import { NotificationPrefsForm } from "@/components/worker/NotificationPrefsForm";
import { NotificationInbox } from "@/components/notifications/NotificationInbox";
import { Card, CardContent } from "@/components/ui/card";
import type { NotificationPrefInput } from "@/lib/validations";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { t } = await getT();

  const pref = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  const defaults: Partial<NotificationPrefInput> | undefined = pref
    ? {
        cities: pref.cities,
        radius: pref.radius,
        categories: pref.categories,
        urgentOnly: pref.urgentOnly,
        enabled: pref.enabled,
        inAppEnabled: pref.inAppEnabled,
        emailEnabled: pref.emailEnabled,
        smsEnabled: pref.smsEnabled,
        pushEnabled: pref.pushEnabled,
        nightJobsAllowed: pref.nightJobsAllowed,
        quietHoursStart: pref.quietHoursStart,
        quietHoursEnd: pref.quietHoursEnd,
      }
    : undefined;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={t("notifications.title")}
        description={t("notifications.desc")}
      />
      <div className="mb-8">
        <NotificationInbox />
      </div>
      <Card>
        <CardContent className="pt-6">
          <NotificationPrefsForm defaultValues={defaults} />
        </CardContent>
      </Card>
    </div>
  );
}
