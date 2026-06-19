import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verificationSchema } from "@/lib/validations";
import { NotificationService } from "@/lib/notifications";
import { VERIFICATION_STATUS_LABELS } from "@/lib/constants";

/**
 * Admin sets the verification status of a worker or employer profile.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = verificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { target, profileId, status, note } = parsed.data;
  const verificationNote = note || null;

  const userId =
    target === "WORKER"
      ? (
          await prisma.workerProfile.update({
            where: { id: profileId },
            data: { verificationStatus: status, verificationNote },
          })
        ).userId
      : (
          await prisma.employerProfile.update({
            where: { id: profileId },
            data: { verificationStatus: status, verificationNote },
          })
        ).userId;

  void NotificationService.sendInternalNotification({
    userId,
    type: "VERIFICATION_UPDATE",
    title: "인증 상태 변경",
    body: `회원님의 인증 상태가 "${VERIFICATION_STATUS_LABELS[status]}"(으)로 변경되었습니다.`,
  });

  return NextResponse.json({ ok: true });
}
