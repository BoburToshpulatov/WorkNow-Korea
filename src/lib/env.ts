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
/** Staging and production are both real, shared deployments. */
export const isDeployed = env.appEnv !== "development";

const PLACEHOLDER_SECRET = "replace-with-a-long-random-string";

export interface EnvValidation {
  errors: string[];
  warnings: string[];
}

function missing(keys: string[]): string[] {
  return keys.filter((k) => !process.env[k]);
}

export function checkEnv(): EnvValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!env.databaseUrl) errors.push("DATABASE_URL is required.");
  if (!env.authSecret) errors.push("AUTH_SECRET (or NEXTAUTH_SECRET) is required.");

  // A Vercel deploy that forgot APP_ENV would silently run with dev defaults.
  if (process.env.VERCEL && !isDeployed) {
    errors.push("Running on Vercel with APP_ENV=development — set APP_ENV=staging or production.");
  }

  if (isDeployed) {
    // Fatal on staging and production (serverless, shared, real phones):
    if (env.uploadStorage !== "s3") {
      errors.push(
        `UPLOAD_STORAGE must be 's3' on ${env.appEnv} — serverless disks are read-only/ephemeral.`
      );
    }
    if (env.uploadStorage === "s3") {
      const m = missing(["AWS_REGION", "AWS_S3_BUCKET", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]);
      if (m.length) errors.push(`UPLOAD_STORAGE=s3 but missing: ${m.join(", ")}.`);
    }
    if (env.authSecret === PLACEHOLDER_SECRET) {
      errors.push("AUTH_SECRET is still the placeholder value.");
    }
    if (!env.appUrl.startsWith("https://")) {
      errors.push(`APP_URL must be a real https URL on ${env.appEnv}.`);
    }
    if (!process.env.CRON_SECRET) {
      errors.push("CRON_SECRET is required — job expiry and document cleanup crons return 503 without it.");
    }
    if (process.env.RATE_LIMIT_PROVIDER !== "redis") {
      errors.push("RATE_LIMIT_PROVIDER must be 'redis' — in-memory limits reset on every serverless instance.");
    } else {
      const m = missing(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]);
      if (m.length) errors.push(`RATE_LIMIT_PROVIDER=redis but missing: ${m.join(", ")}.`);
    }
    // SMS: if selected as the active provider, its credentials must be complete.
    if (env.notificationProvider === "sms") {
      const m = missing(["SMS_PROVIDER_KEY", "SMS_PROVIDER_SECRET", "SMS_SENDER_PHONE"]);
      if (m.length) errors.push(`NOTIFICATION_PROVIDER=sms but missing: ${m.join(", ")}.`);
    }
    if (env.enableErrorMonitoring && !env.sentryDsn) {
      errors.push("ENABLE_ERROR_MONITORING=true but SENTRY_DSN is missing.");
    }
    if (!env.enableErrorMonitoring) {
      warnings.push(`ENABLE_ERROR_MONITORING is off on ${env.appEnv}.`);
    }
    if (isProduction && env.notificationProvider === "mock") {
      warnings.push("NOTIFICATION_PROVIDER=mock in production — no SMS will be sent.");
    }
  } else if (env.uploadStorage === "local") {
    warnings.push("Using LOCAL document storage (development only).");
  }

  return { errors, warnings };
}

/** Validate at startup. Throws on staging/production if there are fatal errors. */
export function validateEnv(): void {
  const { errors, warnings } = checkEnv();
  for (const w of warnings) console.warn(`[env] ⚠ ${w}`);
  if (errors.length) {
    const msg = `[env] Invalid configuration:\n - ${errors.join("\n - ")}`;
    if (isDeployed) throw new Error(msg);
    console.error(msg);
  }
}
