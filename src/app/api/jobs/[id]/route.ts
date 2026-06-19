import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { jobSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnedJob(jobId: string, userId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { employer: true },
  });
  if (!job) return { job: null, owned: false };
  return { job, owned: job.employer.userId === userId };
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: { employer: true },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Live jobs are public. Non-live jobs (PENDING/REJECTED/CANCELLED) are only
  // visible to the owning employer or an admin, so contact details and
  // unapproved listings are not exposed to the public.
  const isLive = job.status === "OPEN" || job.status === "FILLED";
  if (!isLive) {
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";
    const isOwner = session?.user?.id === job.employer.userId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ job });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { job, owned } = await getOwnedJob(id, session.user.id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const updated = await prisma.job.update({
    where: { id },
    data: {
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
      safetyNotes: d.safetyNotes || null,
    },
  });

  return NextResponse.json({ job: updated });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { job, owned } = await getOwnedJob(id, session.user.id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Soft-cancel rather than hard delete to preserve interest history.
  await prisma.job.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
