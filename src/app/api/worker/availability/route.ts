import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { availabilityUpdateSchema } from "@/lib/validations";

/** One-click worker availability update (matching engine, Phase 2). */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = availabilityUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Complete your profile first." },
      { status: 400 }
    );
  }

  await prisma.workerProfile.update({
    where: { userId: session.user.id },
    data: { availabilityStatus: parsed.data.availabilityStatus },
  });

  return NextResponse.json({ ok: true, availabilityStatus: parsed.data.availabilityStatus });
}
