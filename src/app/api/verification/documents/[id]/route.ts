import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { readUploadedFile, deleteUploadedFile } from "@/lib/uploads";
import { logAdminAction } from "@/lib/audit";
import { captureError } from "@/lib/error-monitoring";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET — admins stream the actual file; the owner gets metadata only.
 * Documents are NEVER public.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doc = await prisma.verificationDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.deletedAt) {
    return NextResponse.json({ error: "GONE" }, { status: 410 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = doc.ownerUserId === session.user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only admins may download/view the actual file bytes.
  if (!isAdmin) {
    return NextResponse.json({
      document: {
        id: doc.id,
        documentType: doc.documentType,
        originalFilename: doc.originalFilename,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        adminNote: doc.adminNote,
      },
    });
  }

  try {
    const buf = await readUploadedFile(doc.storedFilename);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalFilename)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    captureError(e, { operation: "document.download", documentId: id });
    return NextResponse.json({ error: "FILE_MISSING" }, { status: 410 });
  }
}

/** DELETE — owner may revoke their own document while it is still PENDING. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const doc = await prisma.verificationDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.ownerUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (doc.status !== "PENDING") {
    return NextResponse.json({ error: "ALREADY_REVIEWED" }, { status: 409 });
  }

  await deleteUploadedFile(doc.storedFilename);
  await prisma.verificationDocument.delete({ where: { id } });
  void logAdminAction({
    adminId: session.user.id,
    action: "DOCUMENT_REVOKED",
    targetType: "DOCUMENT",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
