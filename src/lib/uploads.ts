/**
 * Verification document upload helpers.
 *
 * Validation lives here; the actual byte storage is delegated to the active
 * StorageProvider (see src/lib/storage). Files are never under /public and are
 * only reachable through the admin-guarded download route.
 */
import { getStorage, safeStoredName } from "@/lib/storage";

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

// Allowlist by MIME + extension. Executable types are rejected by omission.
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

export interface UploadValidation {
  ok: boolean;
  error?: string;
  ext?: string;
}

export function validateUpload(mimeType: string, sizeBytes: number): UploadValidation {
  const ext = ALLOWED[mimeType];
  if (!ext) return { ok: false, error: "UNSUPPORTED_TYPE" };
  if (sizeBytes <= 0) return { ok: false, error: "EMPTY" };
  if (sizeBytes > MAX_FILE_BYTES) return { ok: false, error: "TOO_LARGE" };
  return { ok: true, ext };
}

export { safeStoredName };

export async function saveUploadedFile(
  storedFilename: string,
  data: Buffer,
  mimeType?: string
): Promise<void> {
  await getStorage().saveFile(storedFilename, data, mimeType);
}

export async function readUploadedFile(storedFilename: string): Promise<Buffer> {
  return getStorage().getFileStream(storedFilename);
}

export async function deleteUploadedFile(storedFilename: string): Promise<void> {
  await getStorage().deleteFile(storedFilename);
}
