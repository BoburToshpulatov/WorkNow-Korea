import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const saved = await prisma.savedJob.upsert({
    where: { jobId_userId: { jobId: id, userId: session.user.id } },
    create: { jobId: id, userId: session.user.id },
    update: {},
  });

  return NextResponse.json({ saved }, { status: 201 });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.savedJob.deleteMany({
    where: { jobId: id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
