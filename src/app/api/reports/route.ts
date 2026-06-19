import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reportSchema } from "@/lib/validations";
import { enforceRateLimit } from "@/lib/rate-limit";
import { captureError } from "@/lib/error-monitoring";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Throttle abuse: cap reports per user.
  const limited = await enforceRateLimit(`report:${session.user.id}`, 10, 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // If a jobId is supplied, make sure it exists before recording the report.
  if (d.jobId) {
    const job = await prisma.job.findUnique({ where: { id: d.jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
  }

  try {
    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        jobId: d.jobId || null,
        reasonCode: d.reasonCode,
        reason: d.reason,
        details: d.details || null,
      },
    });

    // Phase 4 — auto-flag an employer who accumulates open reports.
    if (d.jobId) {
      const job = await prisma.job.findUnique({
        where: { id: d.jobId },
        select: { employerId: true, employer: { select: { jobs: { select: { id: true } } } } },
      });
      if (job) {
        const jobIds = job.employer.jobs.map((j) => j.id);
        const openCount = await prisma.report.count({
          where: { jobId: { in: jobIds }, status: { in: ["OPEN", "REVIEWING"] } },
        });
        if (openCount >= 3) {
          await prisma.employerProfile.update({
            where: { id: job.employerId },
            data: { flaggedForReview: true },
          });
        }
      }
    }

    return NextResponse.json({ id: report.id }, { status: 201 });
  } catch (e) {
    captureError(e, { operation: "report.create" });
    return NextResponse.json({ error: "REPORT_FAILED" }, { status: 500 });
  }
}
