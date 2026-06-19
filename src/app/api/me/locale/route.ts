import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { normalizeLocale } from "@/lib/i18n";

/** Persist the logged-in user's preferred locale (Phase 6). */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const locale = normalizeLocale(body?.locale);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredLocale: locale },
  });
  return NextResponse.json({ ok: true, locale });
}
