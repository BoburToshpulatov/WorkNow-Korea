import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit";
import { captureError } from "@/lib/error-monitoring";
import {
  validateUpload,
  safeStoredName,
  saveUploadedFile,
} from "@/lib/uploads";
import type { DocumentType } from "@prisma/client";

const VALID_TYPES: DocumentType[] = [
  "BUSINESS_REGISTRATION",
  "ID_CARD",
  "VISA_DOCUMENT",
  "OTHER",
];

/** Upload a verification document (multipart/form-data). Login required. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit(`upload:${session.user.id}`, 10, 60_000);
  if (limited) return limited;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const documentType = String(form?.get("documentType") ?? "OTHER") as DocumentType;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(documentType)) {
    return NextResponse.json({ error: "BAD_TYPE" }, { status: 400 });
  }

  const v = validateUpload(file.type, file.size);
  if (!v.ok) {
    return NextResponse.json({ error: v.error }, { status: 400 });
  }

  const ownerType = session.user.role === "EMPLOYER" ? "EMPLOYER" : "WORKER";

  try {
    // Key layout: {ownerType}/{ownerUserId}/{random}.ext (under the private prefix).
    const stored = safeStoredName(v.ext!, `${ownerType}/${session.user.id}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveUploadedFile(stored, buffer, file.type);

    const doc = await prisma.verificationDocument.create({
      data: {
        ownerUserId: session.user.id,
        ownerType,
        documentType,
        // Original name is metadata only; the file is stored under `stored`.
        originalFilename: String(file.name).slice(0, 200),
        storedFilename: stored,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    });

    // Move the owner's profile into the verification queue (unless verified).
    if (ownerType === "EMPLOYER") {
      await prisma.employerProfile.updateMany({
        where: { userId: session.user.id, verificationStatus: { not: "VERIFIED" } },
        data: { verificationStatus: "PENDING" },
      });
    } else {
      await prisma.workerProfile.updateMany({
        where: { userId: session.user.id, verificationStatus: { not: "VERIFIED" } },
        data: { verificationStatus: "PENDING" },
      });
    }

    void logAdminAction({
      adminId: session.user.id,
      action: "DOCUMENT_UPLOADED",
      targetType: "DOCUMENT",
      targetId: doc.id,
      note: `${documentType} (${ownerType})`,
    });

    return NextResponse.json({ id: doc.id, status: doc.status }, { status: 201 });
  } catch (e) {
    captureError(e, { operation: "document.upload", ownerType });
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}
