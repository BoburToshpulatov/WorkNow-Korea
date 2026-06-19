/**
 * Storage provider abstraction for verification documents.
 *
 * UPLOAD_STORAGE selects the provider (local | s3). Local is dev/staging only.
 * Files are PRIVATE — never under /public, never returned as a public URL.
 * Admins read bytes only through the protected download API route.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { env } from "@/lib/env";

export interface FileMetadata {
  exists: boolean;
  sizeBytes: number;
}

export interface StorageProvider {
  readonly name: string;
  saveFile(storedName: string, data: Buffer, mimeType?: string): Promise<void>;
  getFileStream(storedName: string): Promise<Buffer>;
  deleteFile(storedName: string): Promise<void>;
  getMetadata(storedName: string): Promise<FileMetadata>;
}

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "verification");

/** Reject path traversal; allow nested keys (a/b/c). */
function safeKey(storedName: string): string {
  const norm = path.posix.normalize(storedName).replace(/^(\.\.(\/|$))+/, "");
  if (norm.includes("..")) throw new Error("invalid storage key");
  return norm.replace(/^\/+/, "");
}

/** Local filesystem provider (dev/staging). Supports nested keys. */
export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";

  private resolve(storedName: string) {
    return path.join(UPLOAD_DIR, safeKey(storedName));
  }

  async saveFile(storedName: string, data: Buffer): Promise<void> {
    const full = this.resolve(storedName);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data, { mode: 0o600 });
  }

  async getFileStream(storedName: string): Promise<Buffer> {
    return fs.readFile(this.resolve(storedName));
  }

  async deleteFile(storedName: string): Promise<void> {
    await fs.rm(this.resolve(storedName), { force: true });
  }

  async getMetadata(storedName: string): Promise<FileMetadata> {
    try {
      const st = await fs.stat(this.resolve(storedName));
      return { exists: true, sizeBytes: st.size };
    } catch {
      return { exists: false, sizeBytes: 0 };
    }
  }
}

/**
 * Private S3-compatible provider (AWS S3 / Cloudflare R2 / DO Spaces).
 * Objects are written with no public ACL; the bucket should also be private.
 * The full object key is AWS_S3_PRIVATE_PREFIX + storedName.
 */
export class S3StorageProvider implements StorageProvider {
  readonly name = "s3";
  private client: S3Client;
  private bucket: string;
  private prefix: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET ?? "";
    this.prefix = process.env.AWS_S3_PRIVATE_PREFIX ?? "verification/";
    this.client = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      // Optional: S3-compatible endpoints (R2 / Spaces).
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  private key(storedName: string): string {
    return this.prefix.replace(/\/?$/, "/") + safeKey(storedName);
  }

  async saveFile(storedName: string, data: Buffer, mimeType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key(storedName),
        Body: data,
        ContentType: mimeType,
        // No ACL → object stays private (bucket must block public access too).
      })
    );
  }

  async getFileStream(storedName: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: this.key(storedName) })
    );
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  async deleteFile(storedName: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: this.key(storedName) })
    );
  }

  async getMetadata(storedName: string): Promise<FileMetadata> {
    try {
      const res = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: this.key(storedName) })
      );
      return { exists: true, sizeBytes: res.ContentLength ?? 0 };
    } catch {
      return { exists: false, sizeBytes: 0 };
    }
  }
}

let _provider: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (_provider) return _provider;
  _provider = env.uploadStorage === "s3" ? new S3StorageProvider() : new LocalStorageProvider();
  return _provider;
}

/**
 * Random object key. Optionally namespaced (e.g. "WORKER/<userId>"). The
 * caller's input is never used as a filename — only the structured prefix.
 */
export function safeStoredName(ext: string, keyPrefix?: string): string {
  const name = `${Date.now()}_${randomBytes(16).toString("hex")}${ext}`;
  return keyPrefix ? `${keyPrefix.replace(/\/?$/, "/")}${name}` : name;
}
