import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { interestSchema } from "@/lib/validations";
import { Analytics } from "@/lib/analytics";
import { NotificationService } from "@/lib/notifications";
import { normalizeLocale, translate } from "@/lib/i18n";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit(`interest:${session.user.id}`, 30, 60_000);
  if (limited) return limited;
  if (session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = interestSchema.safeParse(body);
  const message = parsed.success ? parsed.data.message || null : null;

  const job = await prisma.job.findUnique({
    where: { id },
    include: { employer: true },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.status !== "OPEN" && job.status !== "FILLED") {
    return NextResponse.json(
      { error: "This job is no longer accepting interest." },
      { status: 409 }
    );
  }

  const existing = await prisma.jobInterest.findUnique({
    where: { jobId_userId: { jobId: id, userId: session.user.id } },
  });

  const interest = await prisma.jobInterest.upsert({
    where: { jobId_userId: { jobId: id, userId: session.user.id } },
    create: { jobId: id, userId: session.user.id, message },
    update: { message },
  });

  // Only fire analytics + notify the employer on the first time a worker
  // signals interest (not on edits to their message).
  if (!existing) {
    void Analytics.jobInterested(id, session.user.id);
    const [worker, employerUser] = await Promise.all([
      prisma.workerProfile.findUnique({ where: { userId: session.user.id } }),
      prisma.user.findUnique({ where: { id: job.employer.userId } }),
    ]);
    const locale = normalizeLocale(employerUser?.preferredLocale);
    void NotificationService.sendInternalNotification({
      userId: job.employer.userId,
      type: "NEW_INTEREST",
      title: translate("notif.interestTitle", locale),
      body: translate("notif.interestBody", locale, {
        name: worker?.name ?? translate("enums.role.WORKER", locale),
        job: job.title,
      }),
      jobId: job.id,
    });
  }

  return NextResponse.json({ interest }, { status: 201 });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.jobInterest.deleteMany({
    where: { jobId: id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
