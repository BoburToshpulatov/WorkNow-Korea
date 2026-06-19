import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { employerProfileSchema } from "@/lib/validations";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = employerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Submitting a business registration number moves the employer into the
  // verification queue (PENDING) so an admin can review it.
  const brn = d.businessRegistrationNumber || null;
  const sharedData = {
    name: d.name,
    businessType: d.businessType,
    city: d.city,
    province: d.province || null,
    district: d.district || null,
    representativeName: d.representativeName || null,
    businessAddress: d.businessAddress || null,
    businessRegistrationNumber: brn,
    bio: d.bio || null,
  };

  const existing = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    select: { verificationStatus: true },
  });
  // Re-enter the queue when verification info is (re)submitted, unless already
  // verified. TODO: integrate 사업자등록번호 lookup against the Korean registry.
  const resubmit =
    brn && existing?.verificationStatus !== "VERIFIED"
      ? { verificationStatus: "PENDING" as const }
      : {};

  const profile = await prisma.employerProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...sharedData,
      verificationStatus: brn ? "PENDING" : "UNVERIFIED",
    },
    update: { ...sharedData, ...resubmit },
  });

  return NextResponse.json({ profile });
}
