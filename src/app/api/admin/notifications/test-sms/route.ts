import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { NotificationService } from "@/lib/notifications";
import { logAdminAction } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/, "Invalid phone"),
  message: z.string().min(1).max(300),
});

/** Founder tool: send a single test SMS (admin only). One number per call. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await NotificationService.sendSmsNotification(
    session.user.id,
    parsed.data.phone,
    `[WorkNow] ${parsed.data.message}`,
    "SYSTEM"
  );

  void logAdminAction({
    adminId: session.user.id,
    action: result.status === "FAILED" ? "TEST_SMS_FAILED" : "TEST_SMS_SENT",
    targetType: "NOTIFICATION",
    targetId: "test-sms",
    note: result.status, // never logs the phone or message body
  });

  return NextResponse.json({ status: result.status, error: result.error });
}
