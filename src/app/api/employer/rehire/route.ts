import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rehireSchema } from "@/lib/validations";
import { NotificationService } from "@/lib/notifications";
import { smsRehireInvite } from "@/lib/sms-templates";
import { normalizeLocale, translate } from "@/lib/i18n";

/**
 * Rehire invite (matching engine, Phase 6). An employer invites a worker who
 * previously COMPLETED a job with them to an OPEN job. Creates an in-app
 * REHIRE_INVITE notification (+ SMS if the worker opted in). Never forces an
 * application — the worker can accept or ignore.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = await enforceRateLimit(`rehire:${session.user.id}`, 60, 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = rehireSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { workerUserId, jobId } = parsed.data;

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!employer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // The target job must belong to this employer and be open for hiring.
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.employerId !== employer.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (job.status !== "OPEN") {
    return NextResponse.json({ error: "Job is not open" }, { status: 400 });
  }

  // The worker must have COMPLETED at least one of this employer's jobs.
  const priorCompletion = await prisma.jobInterest.findFirst({
    where: {
      userId: workerUserId,
      status: "COMPLETED",
      job: { employerId: employer.id },
    },
  });
  if (!priorCompletion) {
    return NextResponse.json(
      { error: "No completed job with this worker" },
      { status: 400 }
    );
  }

  const worker = await prisma.user.findUnique({
    where: { id: workerUserId },
    include: { notificationPrefs: true, workerProfile: true },
  });
  if (!worker) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  const locale = normalizeLocale(
    worker.preferredLocale ?? worker.workerProfile?.languages?.[0]
  );

  await NotificationService.sendInternalNotification({
    userId: worker.id,
    type: "REHIRE_INVITE",
    title: translate("match.inviteTitle", locale),
    body: translate("match.inviteBody", locale, {
      employer: employer.name,
      job: job.title,
    }),
    jobId: job.id,
  });

  // SMS only with explicit consent (mirrors matching rules).
  const prefs = worker.notificationPrefs;
  if (prefs?.smsEnabled && prefs.smsConsentAt) {
    const sms = smsRehireInvite(
      { employerName: employer.name, jobTitle: job.title },
      locale
    );
    await NotificationService.sendSmsNotification(
      worker.id,
      worker.phone,
      sms,
      "REHIRE_INVITE",
      job.id
    );
  }

  return NextResponse.json({ ok: true });
}
