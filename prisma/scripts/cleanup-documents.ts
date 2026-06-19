/**
 * Document retention cleanup (manual run). Run: npm run documents:cleanup
 * Delegates to the shared logic in src/lib/document-cleanup.ts.
 */
import { PrismaClient } from "@prisma/client";
import { runDocumentCleanup } from "../../src/lib/document-cleanup";

const prisma = new PrismaClient();

runDocumentCleanup()
  .then((r) =>
    console.log(
      `[cleanup] removed files for ${r.rejected} rejected + ${r.approvedExpired} approved/expired document(s).`
    )
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
