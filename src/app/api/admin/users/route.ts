import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = req.nextUrl.searchParams.get("role") as Role | null;

  const users = await prisma.user.findMany({
    where: role ? { role } : undefined,
    include: {
      workerProfile: true,
      employerProfile: true,
      notificationPrefs: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
