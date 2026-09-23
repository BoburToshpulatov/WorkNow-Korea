/**
 * Job expiry (manual run). Run: npm run jobs:expire
 * Delegates to the shared logic in src/lib/job-expiry.ts.
 */
import { PrismaClient } from "@prisma/client";
import { expireStaleJobs } from "../../src/lib/job-expiry";

const prisma = new PrismaClient();

expireStaleJobs()
  .then((r) => console.log(`[expire] marked ${r.expired} stale job(s) EXPIRED.`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
