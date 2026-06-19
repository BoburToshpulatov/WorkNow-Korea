import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { NotificationService } from "@/lib/notifications";
import { deleteUploadedFile } from "@/lib/uploads";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
  adminNote: z.string().max(1000).optional().or(z.literal("")),
});

/** Admin reviews a verification document (approve / reject + note). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const doc = await prisma.verificationDocument.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminNote: parsed.data.adminNote || null,
      reviewedAt: new Date(),
      reviewedByAdminId: session.user.id,
    },
  });

  void logAdminAction({
    adminId: session.user.id,
    action:
      parsed.data.status === "REJECTED" ? "DOCUMENT_REJECTED" : "DOCUMENT_REVIEWED",
    targetType: "DOCUMENT",
    targetId: doc.id,
    note: parsed.data.adminNote || parsed.data.status,
  });

  // Let the owner know their document was reviewed.
  void NotificationService.sendInternalNotification({
    userId: doc.ownerUserId,
    type: "VERIFICATION_UPDATE",
    title: "서류 검토 완료 / Document reviewed",
    body:
      parsed.data.status === "APPROVED"
        ? "제출하신 서류가 승인되었습니다. / Your document was approved."
        : "제출하신 서류가 반려되었습니다. / Your document was not approved.",
  });

  return NextResponse.json({ ok: true });
}

/** Admin deletes a document: removes the stored file, soft-deletes the row. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doc = await prisma.verificationDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await deleteUploadedFile(doc.storedFilename);
  } catch {
    /* file may already be gone */
  }
  await prisma.verificationDocument.update({
    where: { id },
    data: { deletedAt: new Date(), deletionReason: "ADMIN_DELETE" },
  });

  void logAdminAction({
    adminId: session.user.id,
    action: "DOCUMENT_DELETED",
    targetType: "DOCUMENT",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
