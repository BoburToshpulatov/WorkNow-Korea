import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { jobSchema } from "@/lib/validations";
import { buildJobWhereClause } from "@/lib/matching";
import { notifyMatchingWorkers } from "@/lib/notifications";
import { initialJobStatus } from "@/lib/trust";
import { isJobExpired } from "@/lib/job-expiry";
import { Analytics } from "@/lib/analytics";
import type { CategoryValue } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const where = buildJobWhereClause({
    city: sp.get("city") ?? undefined,
    categories: sp.get("category")
      ? [sp.get("category") as CategoryValue]
      : undefined,
    urgentOnly: sp.get("quick") === "urgent" || sp.get("urgentOnly") === "true",
    language: sp.get("language") ?? undefined,
  });

  const quick = sp.get("quick");
  if (quick === "sameDayPay") (where as Prisma.JobWhereInput).paymentTiming = "SAME_DAY";
  if (quick === "night") {
    // Night quick filter is best-effort on durationDetails text for the MVP.
    (where as Prisma.JobWhereInput).durationDetails = {
      contains: "night",
      mode: "insensitive",
    };
  }
  const salaryType = sp.get("salaryType");
  if (salaryType) {
    (where as Prisma.JobWhereInput).salaryType = salaryType as never;
  }

  const jobs = await prisma.job.findMany({
    where,
    include: { employer: true },
    orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit(`postjob:${session.user.id}`, 30, 60_000);
  if (limited) return limited;
  if (session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!employer) {
    return NextResponse.json(
      { error: "Complete your business profile first." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const d = parsed.data;
  if (isJobExpired({ startDateTime: d.startDateTime, durationType: d.durationType })) {
    return NextResponse.json({ error: "START_IN_PAST" }, { status: 400 });
  }

  const status = initialJobStatus(employer);
  const job = await prisma.job.create({
    data: {
      employerId: employer.id,
      title: d.title,
      category: d.category,
      description: d.description,
      address: d.address,
      province: d.province || null,
      city: d.city,
      district: d.district || null,
      region: d.region,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      startDateTime: d.startDateTime,
      durationType: d.durationType,
      durationDetails: d.durationDetails,
      workersNeeded: d.workersNeeded,
      salaryAmount: d.salaryAmount,
      salaryType: d.salaryType,
      paymentTiming: d.paymentTiming,
      requiredSkills: d.requiredSkills,
      languagePreference: d.languagePreference,
      visaNote: d.visaNote || null,
      contactPhone: d.contactPhone,
      kakaoId: d.kakaoId || null,
      isUrgent: d.isUrgent,
      urgencyType: d.urgencyType ?? null,
      locationNote: d.locationNote || null,
      nearPublicTransport: d.nearPublicTransport,
      parkingAvailable: d.parkingAvailable,
      shuttleProvided: d.shuttleProvided,
      pickupAvailable: d.pickupAvailable,
      transportNote: d.transportNote || null,
      safetyNotes: d.safetyNotes || null,
      status: status,
      publishedAt: status === "OPEN" ? new Date() : null,
    },
  });

  void Analytics.jobCreated(job.id, session.user.id);

  // Verified employers go live immediately → fan out now. Otherwise the job is
  // PENDING and fan-out happens on admin approval (see admin/jobs PATCH).
  if (job.status === "OPEN") {
    void notifyMatchingWorkers(job.id).catch(() => undefined);
  }

  return NextResponse.json({ job }, { status: 201 });
}
