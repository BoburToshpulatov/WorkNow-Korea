/**
 * Structured server logger with sensitive-field redaction (Phase 4).
 * JSON lines in production; readable in dev. Never log secrets/PII raw.
 */

type Level = "debug" | "info" | "warn" | "error";

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN: Level = (process.env.LOG_LEVEL as Level) ?? "info";

// Keys whose values must never appear in logs.
const REDACT = new Set([
  "password",
  "passwordHash",
  "hashedPassword",
  "storedFilename",
  "originalFilename",
  "businessRegistrationNumber",
  "brn",
  "authSecret",
  "secret",
  "token",
  "csrfToken",
]);

function redact(value: unknown, depth = 0): unknown {
  if (value == null || depth > 4) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (REDACT.has(k)) out[k] = "[redacted]";
      else if (k === "phone" && typeof v === "string") out[k] = maskPhone(v);
      else out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

/** Mask a phone to its last 4 digits for debugging without exposing PII. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return digits.length >= 4 ? `***-****-${digits.slice(-4)}` : "***";
}

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  if (ORDER[level] < ORDER[MIN]) return;
  const safe = context ? (redact(context) as Record<string, unknown>) : undefined;
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(safe ? { context: safe } : {}),
  };
  const line =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(entry)
      : `[${level}] ${message}${safe ? " " + JSON.stringify(safe) : ""}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => emit("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => emit("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => emit("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => emit("error", m, c),
};
