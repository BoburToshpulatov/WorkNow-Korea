import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { quickJobSchema } from "@/lib/validations";
import { Analytics } from "@/lib/analytics";
import { notifyMatchingWorkers } from "@/lib/notifications";
import { CATEGORY_MAP, type CategoryValue } from "@/lib/constants";
import type { DurationType } from "@prisma/client";

// Map salary cadence to a sensible default duration type.
const DURATION_BY_SALARY: Record<string, DurationType> = {
  HOURLY: "HOURLY",
  DAILY: "DAILY",
  MONTHLY: "MONTHLY",
  FIXED: "MULTI_DAY",
};

/**
 * Quick post (Phase 4): create a job from the essentials only. Missing required
 * fields are filled with safe defaults; the employer can add detail later.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit(`quickjob:${session.user.id}`, 20, 60_000);
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
  const parsed = quickJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const categoryLabel =
    CATEGORY_MAP[d.category as CategoryValue]?.labelKo ?? d.category;

  const job = await prisma.job.create({
    data: {
      employerId: employer.id,
      title: `${categoryLabel} · ${d.district} (${employer.name})`,
      category: d.category,
      description:
        "빠른 등록 공고입니다. 자세한 근무 조건은 고용주에게 직접 문의해 주세요. / Quick-posted job — please contact the employer for full details.",
      address: d.district,
      province: d.province || null,
      city: d.city,
      district: d.district,
      region: d.district,
      startDateTime: d.startDateTime,
      durationType: DURATION_BY_SALARY[d.salaryType] ?? "DAILY",
      durationDetails: "협의 / To be discussed",
      workersNeeded: d.workersNeeded,
      salaryAmount: d.salaryAmount,
      salaryType: d.salaryType,
      paymentTiming: "SAME_DAY",
      requiredSkills: [],
      languagePreference: [],
      contactPhone: d.contactPhone,
      isUrgent: d.isUrgent,
      status: "PENDING", // same moderation flow as the full form
    },
  });

  void Analytics.jobCreated(job.id, session.user.id);
  // Jobs start PENDING; fan-out happens on admin approval. If already OPEN, notify.
  if (job.status === "OPEN") {
    void notifyMatchingWorkers(job.id).catch(() => undefined);
  }

  return NextResponse.json({ job }, { status: 201 });
}
