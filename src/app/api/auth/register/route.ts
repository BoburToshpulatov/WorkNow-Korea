import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { enforceRateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(`register:${clientKey(req)}`, 5, 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { phone, password, role, email, locale } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this phone number already exists." },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      phone,
      password: hashed,
      role,
      email: email && email.length > 0 ? email : null,
      preferredLocale: locale ?? "ko", // default Korean unless chosen
    },
  });

  return NextResponse.json({ id: user.id, role: user.role }, { status: 201 });
}
