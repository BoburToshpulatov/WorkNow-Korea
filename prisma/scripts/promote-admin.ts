/**
 * Promote an existing account to ADMIN (production has no seed).
 * The person registers normally first, so no password passes through here.
 * Run: npm run admin:promote -- 010-1234-5678
 * Point DATABASE_URL at the target DB (e.g. the Supabase session pooler).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const phone = process.argv[2];
  if (!phone) {
    console.error("Usage: npm run admin:promote -- <phone>");
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    console.error(`✗ No user with phone ${phone}. Register through the app first.`);
    process.exit(1);
  }
  if (user.role === "ADMIN") {
    console.log(`${phone} is already ADMIN.`);
    return;
  }
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  console.log(`✓ ${phone} promoted from ${user.role} to ADMIN. They must log out and back in.`);
}

main().finally(() => prisma.$disconnect());
