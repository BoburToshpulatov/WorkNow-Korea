/**
 * Shared document-retention cleanup logic (used by the npm script and the cron
 * route). Removes stored FILES past retention and soft-deletes the rows so the
 * audit trail survives.
 *
 * NOT legal advice — retention windows must be reviewed by Korean counsel (PIPA).
 */
import { prisma } from "./prisma";
import { getStorage } from "./storage";
import { env } from "./env";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function purge(reason: string, where: object): Promise<number> {
  const docs = await prisma.verificationDocument.findMany({
    where: { deletedAt: null, ...where },
  });
  for (const d of docs) {
    try {
      await getStorage().deleteFile(d.storedFilename);
    } catch {
      /* file may already be gone */
    }
    await prisma.verificationDocument.update({
      where: { id: d.id },
      data: { deletedAt: new Date(), deletionReason: reason },
    });
  }
  return docs.length;
}

export async function runDocumentCleanup(): Promise<{
  rejected: number;
  approvedExpired: number;
}> {
  const rejected = await purge("RETENTION_REJECTED", {
    status: "REJECTED",
    uploadedAt: { lt: daysAgo(env.rejectedDocumentRetentionDays) },
  });
  const approvedExpired = await purge("RETENTION_APPROVED", {
    status: "APPROVED",
    OR: [
      { expiresAt: { not: null, lt: new Date() } },
      { uploadedAt: { lt: daysAgo(env.documentRetentionDays) } },
    ],
  });

  // Audit the run.
  await prisma.adminAuditLog.create({
    data: {
      adminId: "system",
      action: "DOCUMENT_CLEANUP",
      targetType: "DOCUMENT",
      targetId: "batch",
      note: `rejected=${rejected} approvedExpired=${approvedExpired}`,
    },
  });

  return { rejected, approvedExpired };
}
