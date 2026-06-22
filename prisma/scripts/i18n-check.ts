/**
 * i18n:check — verifies locale catalogs are complete and consistent.
 *
 * Korean (ko) is the source of truth.
 *  - English (en) MUST mirror every ko key (fail otherwise).
 *  - Uzbek (uz) MUST mirror every USER-FACING ko key. Keys under the
 *    admin-only namespaces below are allowed to fall back (uz → en), so they
 *    are not required in uz.
 *
 * Also reports extra keys (present in en/uz but not ko) as warnings.
 *
 * Run: npm run i18n:check
 */
import ko from "../../src/locales/ko";
import en from "../../src/locales/en";
import uz from "../../src/locales/uz";

// Top-level namespaces that may remain untranslated in Uzbek (fallback to EN).
const UZ_ADMIN_ONLY = new Set(["admin"]);

type Dict = Record<string, unknown>;

function flatten(obj: Dict, prefix = ""): Set<string> {
  const keys = new Set<string>();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const nested of Array.from(flatten(v as Dict, path))) keys.add(nested);
    } else {
      keys.add(path);
    }
  }
  return keys;
}

const koKeys = flatten(ko as Dict);
const enKeys = flatten(en as Dict);
const uzKeys = flatten(uz as Dict);

const isAdminOnly = (key: string) => UZ_ADMIN_ONLY.has(key.split(".")[0]);

// Missing keys.
const enMissing = Array.from(koKeys).filter((k) => !enKeys.has(k));
const uzMissing = Array.from(koKeys).filter((k) => !isAdminOnly(k) && !uzKeys.has(k));

// Extra keys (warnings only).
const enExtra = Array.from(enKeys).filter((k) => !koKeys.has(k));
const uzExtra = Array.from(uzKeys).filter((k) => !koKeys.has(k));

// Uzbek admin coverage (informational).
const uzAdminCovered = Array.from(koKeys).filter((k) => isAdminOnly(k) && uzKeys.has(k));

function list(label: string, items: string[]) {
  if (!items.length) return;
  console.log(`\n${label} (${items.length}):`);
  for (const k of items.slice(0, 50)) console.log(`  - ${k}`);
  if (items.length > 50) console.log(`  …and ${items.length - 50} more`);
}

console.log(`Keys — ko: ${koKeys.size}, en: ${enKeys.size}, uz: ${uzKeys.size}`);
console.log(
  `Uzbek user-facing required: ${
    Array.from(koKeys).filter((k) => !isAdminOnly(k)).length
  } (admin-only optional: ${Array.from(koKeys).filter(isAdminOnly).length}, of which ${
    uzAdminCovered.length
  } translated)`
);

list("❌ EN missing keys (required)", enMissing);
list("❌ UZ missing user-facing keys (required)", uzMissing);
list("⚠️  EN extra keys (not in ko)", enExtra);
list("⚠️  UZ extra keys (not in ko)", uzExtra);

const failed = enMissing.length > 0 || uzMissing.length > 0;
if (failed) {
  console.error(
    `\n❌ i18n:check FAILED — EN missing ${enMissing.length}, UZ missing ${uzMissing.length} user-facing key(s).`
  );
  process.exit(1);
}
console.log("\n✅ i18n:check passed — EN complete; UZ complete for all user-facing flows.");
