/**
 * Validate a deployment's environment before shipping it.
 * Run: npm run env:check -- .env.staging   (e.g. from `vercel env pull .env.staging`)
 * With no file, checks the local .env. Uses the same rules the app
 * enforces at startup (src/lib/env.ts). Never prints secret values.
 */
import { readFileSync } from "node:fs";

function loadEnvFile(path: string) {
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip trailing comments on unquoted values, then surrounding quotes.
    if (!/^["']/.test(value)) value = value.replace(/\s+#.*$/, "");
    value = value.replace(/^(["'])(.*)\1$/, "$2");
    process.env[key] = value;
  }
}

async function main() {
  const file = process.argv[2] ?? ".env";
  loadEnvFile(file);
  // Import after loading so env.ts reads the target values.
  const { checkEnv, env } = await import("../../src/lib/env");

  console.log(`Checking ${file} — APP_ENV=${env.appEnv}`);
  const { errors, warnings } = checkEnv();
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  if (errors.length) {
    console.log(`\n❌ env:check failed — ${errors.length} error(s). The app will refuse to boot.`);
    process.exit(1);
  }
  console.log("\n✅ env:check passed.");
}

main();
