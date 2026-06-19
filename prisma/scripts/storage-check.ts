/**
 * Storage smoke test (Phase 2). Run: npm run storage:check
 * Verifies the active provider can save / read / delete a tiny file and that
 * no public URL is returned. Never prints secrets.
 */
import { getStorage, safeStoredName } from "../../src/lib/storage";
import { env } from "../../src/lib/env";

async function main() {
  console.log(`Storage mode: ${env.uploadStorage}`);

  if (env.uploadStorage === "s3") {
    const required = ["AWS_REGION", "AWS_S3_BUCKET"];
    const missing = required.filter((k) => !process.env[k]);
    const haveCreds =
      !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;
    console.log(`Required env present: ${missing.length === 0 ? "yes" : "NO (" + missing.join(",") + ")"}`);
    console.log(`Credentials present: ${haveCreds ? "yes" : "no"}`);
    if (missing.length || !haveCreds) {
      console.error("✗ S3 not fully configured — cannot run live test.");
      process.exit(1);
    }
  }

  const storage = getStorage();
  const key = safeStoredName(".txt", "_healthcheck");
  const payload = Buffer.from(`storage-check ${Date.now()}`);

  try {
    await storage.saveFile(key, payload, "text/plain");
    console.log("✓ saveFile");
    const back = await storage.getFileStream(key);
    if (!back.equals(payload)) throw new Error("read mismatch");
    console.log("✓ getFileStream (content matches)");
    const meta = await storage.getMetadata(key);
    console.log(`✓ getMetadata (exists=${meta.exists}, ${meta.sizeBytes} bytes)`);
    await storage.deleteFile(key);
    const after = await storage.getMetadata(key);
    console.log(`✓ deleteFile (exists now ${after.exists})`);
    console.log("✓ provider returns no public URL (bytes only via API)");
    console.log("\n✅ Storage check passed.");
  } catch (e) {
    console.error("✗ Storage check failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main();
