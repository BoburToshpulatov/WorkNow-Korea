import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validations";

/**
 * Create a review. Allowed only after the relevant applicant is COMPLETED:
 *  - employer reviews a worker who completed their job
 *  - worker reviews the employer of a job they completed
 * One review per (job, reviewer, reviewee).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit(`review:${session.user.id}`, 20, 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { jobId, revieweeId, rating, comment } = parsed.data;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { employer: true },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = session.user.role;
  let allowed = false;

  if (role === "EMPLOYER") {
    // Reviewer must own the job; reviewee must be a worker who COMPLETED it.
    if (job.employer.userId === session.user.id) {
      const completed = await prisma.jobInterest.findFirst({
        where: { jobId, userId: revieweeId, status: "COMPLETED" },
      });
      allowed = !!completed;
    }
  } else if (role === "WORKER") {
    // Reviewer must have COMPLETED the job; reviewee must be the job's employer.
    const completed = await prisma.jobInterest.findFirst({
      where: { jobId, userId: session.user.id, status: "COMPLETED" },
    });
    allowed = !!completed && revieweeId === job.employer.userId;
  }

  if (!allowed) {
    return NextResponse.json({ error: "NOT_ELIGIBLE" }, { status: 403 });
  }

  try {
    const review = await prisma.review.create({
      data: {
        jobId,
        reviewerId: session.user.id,
        revieweeId,
        reviewerRole: role === "EMPLOYER" ? "EMPLOYER" : "WORKER",
        rating,
        comment: comment || null,
      },
    });
    return NextResponse.json({ id: review.id }, { status: 201 });
  } catch {
    // Unique violation → already reviewed.
    return NextResponse.json({ error: "ALREADY_REVIEWED" }, { status: 409 });
  }
}
