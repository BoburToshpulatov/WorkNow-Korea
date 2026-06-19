import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/** List the current user's own document metadata (never other users', never file bytes). */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const docs = await prisma.verificationDocument.findMany({
    where: { ownerUserId: session.user.id, deletedAt: null },
    orderBy: { uploadedAt: "desc" },
    // storedFilename is intentionally omitted from the response.
    select: {
      id: true,
      documentType: true,
      originalFilename: true,
      mimeType: true,
      sizeBytes: true,
      status: true,
      uploadedAt: true,
      adminNote: true,
    },
  });
  return NextResponse.json({ documents: docs });
}
