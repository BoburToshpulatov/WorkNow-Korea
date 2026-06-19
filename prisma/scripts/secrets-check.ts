/**
 * secrets:check — scans project source/config/docs for accidentally committed
 * real secrets. Designed to run in CI and pre-commit.
 *
 * It deliberately SKIPS .env and other ignored files (those are gitignored and
 * never committed) and only flags *real-looking* values, not placeholders.
 *
 * Exit code 1 if any likely-real secret is found, else 0.
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

// Directories / files we never scan.
const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "uploads",
  "coverage",
  "out",
  "build",
  ".vercel",
]);

// Files where placeholder secret-shaped strings are expected and allowed.
const ALLOWLIST_FILES = new Set([
  ".env.example",
  "prisma/scripts/secrets-check.ts",
]);

// Substrings that mark a value as an obvious placeholder / demo / fake.
const PLACEHOLDER_HINTS = [
  "replace-with",
  "your-",
  "youruser",
  "example",
  "placeholder",
  "changeme",
  "change-me",
  "dummy",
  "fake",
  "xxxx",
  "<",
  "dev-cron-secret",
  "postgres:postgres@localhost",
  "test-key",
  "sk_test_xxx",
];

type Rule = { name: string; re: RegExp };

const RULES: Rule[] = [
  // DATABASE_URL with a real (non-empty, non-local-trust) password.
  {
    name: "DATABASE_URL with embedded password",
    re: /postgres(?:ql)?:\/\/[^\s:@"']+:[^\s:@"'/]{3,}@/i,
  },
  { name: "AWS access key id", re: /AKIA[0-9A-Z]{16}/ },
  { name: "AWS secret access key", re: /aws_secret[^\n]*[=:]\s*["']?[A-Za-z0-9/+]{40}["']?/i },
  { name: "Sentry DSN", re: /https:\/\/[0-9a-f]{16,}@[a-z0-9.]*ingest[a-z0-9.]*sentry\.io\/\d+/i },
  { name: "Solapi/Coolsms style API secret", re: /(SMS_PROVIDER_SECRET|SMS_PROVIDER_KEY)\s*[=:]\s*["'][A-Za-z0-9]{16,}["']/ },
  { name: "Upstash REST token", re: /UPSTASH_REDIS_REST_TOKEN\s*[=:]\s*["'][A-Za-z0-9_\-=]{20,}["']/ },
  { name: "NEXTAUTH/AUTH secret (base64, non-placeholder)", re: /(NEXTAUTH_SECRET|AUTH_SECRET)\s*[=:]\s*["'][A-Za-z0-9/+]{32,}={0,2}["']/ },
  { name: "CRON_SECRET (non-placeholder)", re: /CRON_SECRET\s*[=:]\s*["'][A-Za-z0-9_\-]{12,}["']/ },
  { name: "Private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: "Generic bearer/api token", re: /(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|xox[baprs]-[A-Za-z0-9-]{10,})/ },
];

function listFiles(): string[] {
  // Prefer git-tracked + untracked-not-ignored; fall back to a manual walk.
  try {
    const out = execSync("git ls-files --cached --others --exclude-standard", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const files = out.split("\n").map((f) => f.trim()).filter(Boolean);
    if (files.length) return files;
  } catch {
    /* not a git repo yet — walk manually */
  }
  const acc: string[] = [];
  const walk = (dir: string) => {
    for (const entry of require("node:fs").readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".env")) {
        if (entry.name !== ".env.example") continue; // skip real env files
      }
      const full = path.join(dir, entry.name);
      const rel = path.relative(ROOT, full);
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        walk(full);
      } else {
        acc.push(rel);
      }
    }
  };
  walk(ROOT);
  return acc;
}

function isAllowed(line: string): boolean {
  const lower = line.toLowerCase();
  // Empty assignment like KEY="" is fine.
  if (/[=:]\s*["']{2}\s*$/.test(line)) return true;
  return PLACEHOLDER_HINTS.some((h) => lower.includes(h));
}

function main() {
  const files = listFiles().filter((f) => {
    if (ALLOWLIST_FILES.has(f)) return false;
    if (f.startsWith(".env") && f !== ".env.example") return false;
    const parts = f.split(path.sep);
    if (parts.some((p) => IGNORE_DIRS.has(p))) return false;
    return true;
  });

  const findings: string[] = [];

  for (const file of files) {
    const abs = path.join(ROOT, file);
    if (!existsSync(abs)) continue;
    try {
      if (statSync(abs).size > 2_000_000) continue; // skip huge/binary
    } catch {
      continue;
    }
    let content: string;
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      continue; // binary
    }
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      if (isAllowed(line)) return;
      for (const rule of RULES) {
        if (rule.re.test(line)) {
          findings.push(`  ${file}:${i + 1}  [${rule.name}]`);
        }
      }
    });
  }

  if (findings.length) {
    console.error("❌ secrets:check FAILED — possible real secrets found:\n");
    console.error(findings.join("\n"));
    console.error(
      "\nIf these are placeholders, add a hint (e.g. 'example', 'replace-with') or move them to .env (gitignored)."
    );
    process.exit(1);
  }

  console.log(`✅ secrets:check passed — scanned ${files.length} files, no real secrets found.`);
}

main();
