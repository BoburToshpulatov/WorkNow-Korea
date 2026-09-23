/**
 * i18n:scan — heuristic detector of hardcoded, user-visible strings.
 *
 * Scans .tsx/.ts under src/ for JSX text nodes and visible-text attributes that
 * contain prose but are NOT wrapped in a t()/translate() call. It is a lint
 * aid, not a compiler — it errs toward reporting, and supports inline opt-out
 * with a trailing `// i18n-ignore` comment.
 *
 * Run: npm run i18n:scan        (report only)
 *      npm run i18n:scan --ci   (exit 1 if findings)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src");

// Files/dirs that are allowed to contain literal strings.
const SKIP_DIR = new Set(["locales"]);
const SKIP_FILE = /\.(test|spec)\.tsx?$|\.d\.ts$/;
// Whole files exempt: catalogs, constants (enum labels), and dev/SSR shims.
const EXEMPT_FILES = new Set([
  "src/lib/constants.ts",
  "src/lib/i18n.ts",
  "src/lib/sms-templates.ts", // localized internally via pick()
]);

// Attributes whose string value is shown to users.
const VISIBLE_ATTRS = /\b(placeholder|title|label|description|heading|alt|emptyTitle|emptyText|cta)\s*=\s*"([^"]+)"/g;

function walk(dir: string, acc: string[]) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIR.has(entry.name)) walk(path.join(dir, entry.name), acc);
    } else if (/\.tsx?$/.test(entry.name) && !SKIP_FILE.test(entry.name)) {
      acc.push(path.join(dir, entry.name));
    }
  }
}

// Has a letter (Latin, Hangul, or Cyrillic) → looks like human prose.
const HAS_PROSE = /[A-Za-z㄰-㆏가-힣Ѐ-ӿ]/;
// Looks like an identifier/className/path rather than prose.
const LOOKS_TECHNICAL = /^[a-z0-9_\-./:]+$/;

// Brand wordmark tokens are intentionally untranslated (brand identity).
const BRAND_ALLOW = new Set(["WorkNow", "Korea", "WorkNow Korea"]);

function isProse(text: string): boolean {
  const t = text.trim();
  if (t.length < 2) return false;
  if (BRAND_ALLOW.has(t)) return false;
  if (!HAS_PROSE.test(t)) return false;
  if (LOOKS_TECHNICAL.test(t)) return false; // e.g. "text-success", "/admin"
  // Pure interpolation / symbols.
  if (/^[{}\s$.,:;|/\\\-—–·•%()[\]]+$/.test(t)) return false;
  return true;
}

interface Finding {
  file: string;
  line: number;
  text: string;
}

function scanFile(file: string, findings: Finding[]) {
  const rel = path.relative(process.cwd(), file);
  if (EXEMPT_FILES.has(rel)) return;
  const lines = readFileSync(file, "utf8").split("\n");
  let inBlockComment = false;

  lines.forEach((raw, i) => {
    const line = raw;
    const trimmed = line.trim();

    // Comment handling.
    if (inBlockComment) {
      if (trimmed.includes("*/")) inBlockComment = false;
      return;
    }
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
    if (trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/")) inBlockComment = true;
      return;
    }
    if (trimmed.endsWith("// i18n-ignore")) return;
    // Skip imports/exports-from and console.* lines.
    if (/^\s*(import|export)\b.*\bfrom\b/.test(line)) return;
    if (/console\.(log|warn|error|debug)/.test(line)) return;

    // 1) Visible-text attributes with literal values.
    for (const m of Array.from(line.matchAll(VISIBLE_ATTRS))) {
      const val = m[2];
      if (isProse(val)) findings.push({ file: rel, line: i + 1, text: `${m[1]}="${val}"` });
    }

    // 2) JSX text nodes: >text< with no braces (so {t(...)} is excluded).
    //    Only meaningful in .tsx — in .ts, `>` is comparison/generics.
    if (file.endsWith(".tsx")) {
      for (const m of Array.from(line.matchAll(/>([^<>{}]+)</g))) {
        const text = m[1];
        if (isProse(text)) findings.push({ file: rel, line: i + 1, text: text.trim() });
      }
    }
  });
}

const files: string[] = [];
walk(ROOT, files);
const findings: Finding[] = [];
for (const f of files) scanFile(f, findings);

if (findings.length === 0) {
  console.log(`✅ i18n:scan — no hardcoded user-visible strings found (${files.length} files).`);
  process.exit(0);
}

console.log(`i18n:scan — ${findings.length} suspicious string(s) in ${files.length} files:\n`);
let lastFile = "";
for (const f of findings) {
  if (f.file !== lastFile) {
    console.log(`\n${f.file}`);
    lastFile = f.file;
  }
  console.log(`  ${f.line}: ${f.text}`);
}

const ci = process.argv.includes("--ci");
if (ci) {
  console.error(`\n❌ i18n:scan FAILED — ${findings.length} hardcoded string(s). Wrap in t() or add // i18n-ignore.`);
  process.exit(1);
}
console.log(`\n⚠️  ${findings.length} finding(s). Review and wrap in t() (or add // i18n-ignore for false positives).`);
