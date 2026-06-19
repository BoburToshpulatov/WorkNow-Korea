/**
 * Developer helper: list users without exposing secrets.
 * Run with: npm run db:check-users
 *
 * Prints phone, role, and whether a bcrypt password hash exists (yes/no).
 * Never prints the hash itself or any password.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { phone: true, role: true, email: true, password: true },
  });

  if (users.length === 0) {
    console.log("⚠️  No users found. Did you run `npm run db:seed`?");
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);
  console.log(
    "PHONE".padEnd(16) +
      "ROLE".padEnd(10) +
      "HASH?".padEnd(7) +
      "EMAIL"
  );
  console.log("-".repeat(60));
  for (const u of users) {
    const hasHash =
      typeof u.password === "string" && u.password.startsWith("$2") ? "yes" : "no";
    console.log(
      u.phone.padEnd(16) +
        u.role.padEnd(10) +
        hasHash.padEnd(7) +
        (u.email ?? "—")
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
