/**
 * Centralized environment configuration + startup validation (Phase 1).
 *
 * Production must NOT silently run with unsafe defaults — validateEnv() throws
 * for fatal misconfigurations (e.g. local document storage in production) and
 * warns for soft issues. Called from src/instrumentation.ts at boot.
 */

export type AppEnv = "development" | "staging" | "production";
export type UploadStorage = "local" | "s3";

function pick<T extends string>(value: string | undefined, allowed: T[], fallback: T): T {
  return value && (allowed as string[]).includes(value) ? (value as T) : fallback;
}

export const env = {
  appEnv: pick<AppEnv>(process.env.APP_ENV, ["development", "staging", "production"], "development"),
  appUrl: process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  uploadStorage: pick<UploadStorage>(process.env.UPLOAD_STORAGE, ["local", "s3"], "local"),
  authSecret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  notificationProvider: process.env.NOTIFICATION_PROVIDER ?? "mock",
  enableErrorMonitoring: process.env.ENABLE_ERROR_MONITORING === "true",
  sentryDsn: process.env.SENTRY_DSN ?? "",
  documentRetentionDays: Number(process.env.DOCUMENT_RETENTION_DAYS ?? "90"),
  rejectedDocumentRetentionDays: Number(
    process.env.REJECTED_DOCUMENT_RETENTION_DAYS ?? "14"
  ),
};

export const isProduction = env.appEnv === "production";

const PLACEHOLDER_SECRET = "replace-with-a-long-random-string";

export interface EnvValidation {
  errors: string[];
  warnings: string[];
}

export function checkEnv(): EnvValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!env.databaseUrl) errors.push("DATABASE_URL is required.");
  if (!env.authSecret) errors.push("AUTH_SECRET (or NEXTAUTH_SECRET) is required.");

  if (isProduction) {
    // Fatal in production:
    if (env.uploadStorage !== "s3") {
      errors.push(
        "UPLOAD_STORAGE must be 's3' in production — local document storage is not allowed."
      );
    }
    if (env.authSecret === PLACEHOLDER_SECRET) {
      errors.push("AUTH_SECRET is still the placeholder value.");
    }
    if (env.appUrl.startsWith("http://localhost")) {
      errors.push("APP_URL must be a real https URL in production.");
    }
    if (env.uploadStorage === "s3" && !process.env.AWS_S3_BUCKET) {
      errors.push("AWS_S3_BUCKET is required when UPLOAD_STORAGE=s3.");
    }
    // SMS: if selected as the active provider, its credentials must be complete.
    if (env.notificationProvider === "sms") {
      const missing = ["SMS_PROVIDER_KEY", "SMS_PROVIDER_SECRET", "SMS_SENDER_PHONE"].filter(
        (k) => !process.env[k]
      );
      if (missing.length) {
        errors.push(
          `NOTIFICATION_PROVIDER=sms but missing: ${missing.join(", ")}.`
        );
      }
    }
    if (!env.enableErrorMonitoring) {
      warnings.push("ENABLE_ERROR_MONITORING is off in production.");
    }
  } else {
    if (env.uploadStorage === "local") {
      warnings.push("Using LOCAL document storage (development/staging only).");
    }
  }

  return { errors, warnings };
}

/** Validate at startup. Throws in production if there are fatal errors. */
export function validateEnv(): void {
  const { errors, warnings } = checkEnv();
  for (const w of warnings) console.warn(`[env] ⚠ ${w}`);
  if (errors.length) {
    const msg = `[env] Invalid configuration:\n - ${errors.join("\n - ")}`;
    if (isProduction) throw new Error(msg);
    console.error(msg);
  }
}
