import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NotificationService } from "@/lib/notifications";
import { logAdminAction } from "@/lib/audit";

/**
 * Re-attempt delivery of FAILED notification log rows (Phase 6).
 * Re-sends via the active provider and updates each row's status.
 */
export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const failed = await prisma.notificationLog.findMany({
    where: { status: "FAILED" },
    take: 100,
  });

  let retried = 0;
  for (const log of failed) {
    if (log.channel === "SMS") {
      await NotificationService.sendSmsNotification(
        log.userId,
        log.recipient,
        log.message,
        log.type,
        log.jobId
      );
      retried++;
    } else if (log.channel === "KAKAO") {
      await NotificationService.sendKakaoNotification(
        log.userId,
        log.recipient,
        log.message,
        log.type,
        log.jobId
      );
      retried++;
    }
    // The original FAILED row stays for the audit trail; a new attempt row is
    // written by the service (with its fresh status).
  }

  void logAdminAction({
    adminId: session.user.id,
    action: "NOTIFICATIONS_RERUN",
    targetType: "NOTIFICATION",
    targetId: "failed",
    note: `retried ${retried}`,
  });

  return NextResponse.json({ retried });
}
