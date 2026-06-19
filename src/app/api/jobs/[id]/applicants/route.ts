import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { interestStatusSchema } from "@/lib/validations";
import { Analytics } from "@/lib/analytics";
import { NotificationService } from "@/lib/notifications";
import { INTEREST_STATUS_LABELS } from "@/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Employer updates an applicant's lifecycle status:
 * INTERESTED → CONTACTED → HIRED → COMPLETED (or NO_SHOW).
 * Only the job owner may do this.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = interestStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Verify the interest belongs to this job and the job belongs to this user.
  const interest = await prisma.jobInterest.findUnique({
    where: { id: parsed.data.interestId },
    include: { job: { include: { employer: true } } },
  });
  if (!interest || interest.jobId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (interest.job.employer.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Safeguard: don't hire more workers than the job needs.
  if (parsed.data.status === "HIRED" && interest.status !== "HIRED") {
    const hiredCount = await prisma.jobInterest.count({
      where: { jobId: id, status: "HIRED" },
    });
    if (hiredCount >= interest.job.workersNeeded) {
      return NextResponse.json(
        { error: "WORKERS_FULL", workersNeeded: interest.job.workersNeeded },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.jobInterest.update({
    where: { id: interest.id },
    data: { status: parsed.data.status },
  });

  // Analytics for the hiring funnel.
  if (parsed.data.status === "HIRED") {
    void Analytics.workerHired(id, interest.userId);
  } else if (parsed.data.status === "COMPLETED") {
    void Analytics.jobCompleted(id, interest.userId);
  }

  // Notify the worker about meaningful status changes.
  if (["HIRED", "CONTACTED", "COMPLETED", "NO_SHOW"].includes(parsed.data.status)) {
    void NotificationService.sendInternalNotification({
      userId: interest.userId,
      type: "STATUS_CHANGE",
      title: "지원 상태 변경 / Application update",
      body: `"${interest.job.title}" · ${INTEREST_STATUS_LABELS[parsed.data.status]}`,
      jobId: id,
    });
  }

  // Tell the employer whether the job is now fully staffed.
  const hiredAfter = await prisma.jobInterest.count({
    where: { jobId: id, status: "HIRED" },
  });

  return NextResponse.json({
    interest: updated,
    hiredCount: hiredAfter,
    workersNeeded: interest.job.workersNeeded,
    full: hiredAfter >= interest.job.workersNeeded,
  });
}
