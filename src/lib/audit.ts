import { prisma } from "./prisma";

/** Append an admin audit-log entry (best-effort; never throws). */
export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  note?: string | null;
}): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        note: params.note ?? null,
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[audit] failed to record", params.action, e);
    }
  }
}
