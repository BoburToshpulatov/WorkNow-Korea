import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notificationPrefSchema } from "@/lib/validations";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = notificationPrefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Record (or clear) SMS consent timestamp based on the opt-in toggle.
  const existing = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
    select: { smsConsentAt: true },
  });
  const smsConsentAt = d.smsEnabled
    ? existing?.smsConsentAt ?? new Date() // first opt-in stamps consent time
    : null; // opting out clears consent

  const data = {
    cities: d.cities,
    radius: d.radius,
    categories: d.categories,
    urgentOnly: d.urgentOnly,
    enabled: d.enabled,
    inAppEnabled: d.inAppEnabled,
    emailEnabled: d.emailEnabled,
    smsEnabled: d.smsEnabled,
    pushEnabled: d.pushEnabled,
    nightJobsAllowed: d.nightJobsAllowed,
    quietHoursStart: d.quietHoursStart ?? null,
    quietHoursEnd: d.quietHoursEnd ?? null,
    smsConsentAt,
  };

  const pref = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  return NextResponse.json({ pref });
}
