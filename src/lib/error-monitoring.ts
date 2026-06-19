/**
 * Error monitoring (Sentry-backed, optional).
 *
 * Active only when ENABLE_ERROR_MONITORING=true and SENTRY_DSN is set; otherwise
 * the app runs normally and errors are logged via the redacting logger. Sensitive
 * fields are scrubbed before anything is sent to Sentry.
 */
import * as Sentry from "@sentry/node";
import { logger } from "./logger";
import { env } from "./env";

let initialized = false;

const SENSITIVE = [
  "password",
  "passwordHash",
  "hashedPassword",
  "businessRegistrationNumber",
  "brn",
  "storedFilename",
  "originalFilename",
  "secret",
  "token",
  "csrfToken",
  "authSecret",
];

function scrub(obj: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!obj) return obj;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE.includes(k)) out[k] = "[redacted]";
    else if (k === "phone") out[k] = "[redacted]";
    else out[k] = v;
  }
  return out;
}

function ensureInit() {
  if (initialized) return;
  if (env.enableErrorMonitoring && env.sentryDsn) {
    Sentry.init({
      dsn: env.sentryDsn,
      environment: env.appEnv,
      tracesSampleRate: 0,
      // Scrub request data / extras before sending.
      beforeSend(event) {
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
          delete event.request.data;
        }
        if (event.extra) event.extra = scrub(event.extra as Record<string, unknown>);
        return event;
      },
    });
  }
  initialized = true;
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message, {
    ...context,
    stack: error instanceof Error ? error.stack : undefined,
  });

  if (env.enableErrorMonitoring && env.sentryDsn) {
    ensureInit();
    Sentry.captureException(error, { extra: scrub(context) });
  }
}

/**
 * Wrap an async handler body: capture + log unexpected errors with an operation
 * label, then rethrow (the route's own catch decides the HTTP response).
 */
export async function withMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    captureError(e, { operation, ...context });
    throw e;
  }
}
