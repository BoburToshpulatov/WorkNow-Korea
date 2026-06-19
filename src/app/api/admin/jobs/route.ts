import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { adminJobStatusSchema } from "@/lib/validations";
import { notifyMatchingWorkers } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const jobs = await prisma.job.findMany({
    include: { employer: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ jobs });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  const parsed = adminJobStatusSchema.safeParse(body);
  if (!id || !parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const before = await prisma.job.findUnique({ where: { id } });

  const job = await prisma.job.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  // When an admin approves a job (transition into OPEN), fan out alerts to
  // matching workers — the platform's core "instant alert" promise.
  if (job.status === "OPEN" && before?.status !== "OPEN") {
    void notifyMatchingWorkers(job.id).catch(() => undefined);
  }

  return NextResponse.json({ job });
}
