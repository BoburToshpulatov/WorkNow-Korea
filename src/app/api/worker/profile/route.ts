import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { workerProfileSchema } from "@/lib/validations";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = workerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const visaCategory = d.visaCategory ? d.visaCategory : null;
  const data = {
    name: d.name,
    preferredCity: d.preferredCity,
    preferredProvince: d.preferredProvince || null,
    preferredDistrict: d.preferredDistrict || null,
    preferredRadius: d.preferredRadius,
    currentLatitude: d.currentLatitude ?? null,
    currentLongitude: d.currentLongitude ?? null,
    // availabilityStatus is owned by the one-click dashboard selector
    // (/api/worker/availability), so the profile form never overwrites it.
    languages: d.languages,
    categories: d.categories,
    availability: d.availability,
    transport: d.transport,
    experience: d.experience || null,
    visaNote: d.visaNote || null,
    nationality: d.nationality || null,
    visaCategory,
    bio: d.bio || null,
  };

  const existing = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    select: { verificationStatus: true },
  });
  // Declaring an eligibility category submits the worker for verification.
  const resubmit =
    visaCategory && existing?.verificationStatus !== "VERIFIED"
      ? { verificationStatus: "PENDING" as const }
      : {};

  const profile = await prisma.workerProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...data,
      availabilityStatus: d.availabilityStatus,
      verificationStatus: visaCategory ? "PENDING" : "UNVERIFIED",
    },
    update: { ...data, ...resubmit },
  });

  return NextResponse.json({ profile });
}
