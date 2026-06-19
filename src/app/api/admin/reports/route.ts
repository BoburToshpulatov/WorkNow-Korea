import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reportModerationSchema } from "@/lib/validations";

/** Admin updates a report's status / admin note (Phase 4). */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reportModerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { id, status, adminNote } = parsed.data;

  await prisma.report.update({
    where: { id },
    data: { status, adminNote: adminNote || null },
  });

  return NextResponse.json({ ok: true });
}
