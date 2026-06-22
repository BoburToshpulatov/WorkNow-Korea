import { prisma } from "./prisma";
import type { NotificationType } from "@prisma/client";
import {
  getActiveProvider,
  SmsNotificationProvider,
  KakaoNotificationProvider,
  type DeliveryStatus,
  type SendResult,
} from "./notifications/providers";
import { captureError } from "./error-monitoring";
import { normalizeLocale, translate, formatJobSalary, formatDateTime } from "./i18n";
import { smsNewMatchingJob, smsUrgentJob } from "./sms-templates";
import { isAvailableForJob } from "./matching";

/** True if the given time falls in the typical night window (22:00–06:00). */
function isNightHour(d: Date): boolean {
  const h = d.getHours();
  return h >= 22 || h < 6;
}

/** True if `now` is within [start,end) quiet hours (handles overnight wrap). */
function inQuietHours(start: number | null, end: number | null, now: Date): boolean {
  if (start == null || end == null) return false;
  const h = now.getHours();
  return start <= end ? h >= start && h < end : h >= start || h < end;
}

/**
 * NotificationService — the single entry point for all outbound messaging.
 *
 *  - sendInternalNotification(): real. Writes an in-app Notification (inbox)
 *    row + an INTERNAL NotificationLog row (status SENT).
 *  - sendSmsNotification() / sendKakaoNotification(): delegate to the active
 *    provider (NOTIFICATION_PROVIDER), then record a NotificationLog row with
 *    the returned status (SENT / MOCKED / FAILED).
 *
 * Every method is crash-safe: a provider or DB failure is logged and swallowed
 * so it can never break job creation or the interest flow.
 */

const IS_DEV = process.env.NODE_ENV !== "production";

export interface InternalNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  jobId?: string | null;
}

async function recordLog(params: {
  userId: string;
  type: NotificationType;
  channel: "INTERNAL" | "SMS" | "KAKAO";
  status: DeliveryStatus;
  recipient: string;
  message: string;
  jobId?: string | null;
  error?: string;
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        userId: params.userId,
        type: params.type,
        channel: params.channel,
        status: params.status,
        recipient: params.recipient,
        message: params.message,
        jobId: params.jobId ?? null,
        error: params.error ?? null,
      },
    });
  } catch (e) {
    if (IS_DEV) console.warn("[notifications] failed to write log", e);
  }
}

export const NotificationService = {
  /** In-app notification (real). Returns the created notification id (or null). */
  async sendInternalNotification(input: InternalNotificationInput) {
    try {
      const n = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          jobId: input.jobId ?? null,
        },
      });
      await recordLog({
        userId: input.userId,
        type: input.type,
        channel: "INTERNAL",
        status: "SENT",
        recipient: input.userId,
        message: `${input.title} — ${input.body}`,
        jobId: input.jobId,
      });
      return n.id;
    } catch (e) {
      if (IS_DEV) console.warn("[notifications] internal send failed", e);
      return null;
    }
  },

  /** SMS via the active provider. Records a log row; never throws. */
  async sendSmsNotification(
    userId: string,
    phone: string,
    message: string,
    type: NotificationType = "SYSTEM",
    jobId?: string | null
  ): Promise<SendResult> {
    const provider = getActiveProvider();
    let result: SendResult;
    try {
      result =
        provider.name === "sms"
          ? await provider.send(phone, message)
          : await getSmsFallback().send(phone, message);
    } catch (e) {
      result = { status: "FAILED", error: e instanceof Error ? e.message : "sms error" };
    }
    await recordLog({
      userId,
      type,
      channel: "SMS",
      status: result.status,
      recipient: phone,
      message,
      jobId,
      error: result.error,
    });
    return result;
  },

  /** KakaoTalk Alimtalk via the active provider. Records a log row; never throws. */
  async sendKakaoNotification(
    userId: string,
    recipient: string,
    message: string,
    type: NotificationType = "SYSTEM",
    jobId?: string | null
  ): Promise<SendResult> {
    const provider = getActiveProvider();
    let result: SendResult;
    try {
      result =
        provider.name === "kakao"
          ? await provider.send(recipient, message)
          : await getKakaoFallback().send(recipient, message);
    } catch (e) {
      result = { status: "FAILED", error: e instanceof Error ? e.message : "kakao error" };
    }
    await recordLog({
      userId,
      type,
      channel: "KAKAO",
      status: result.status,
      recipient,
      message,
      jobId,
      error: result.error,
    });
    return result;
  },
};

// When the active provider isn't the one a channel wants, fall back to a
// provider instance for that channel (degrades to MOCKED without keys).
let _sms: SmsNotificationProvider | null = null;
let _kakao: KakaoNotificationProvider | null = null;
function getSmsFallback() {
  return (_sms ??= new SmsNotificationProvider());
}
function getKakaoFallback() {
  return (_kakao ??= new KakaoNotificationProvider());
}

// ── Matching (Phase 3) ──────────────────────────────────────────────
/**
 * Fan out a newly-OPEN job to workers whose preferences match.
 *
 * Matching considers:
 *   1. province (NotificationPreference.cities, province-level)
 *   2. district (WorkerProfile.preferredDistrict vs job.district)
 *   3. job category
 *   4. required language (job.languagePreference vs worker languages)
 *   5. urgent-only preference
 *   6. availability (urgent jobs prefer NOW/TODAY workers)
 *   7. notifications enabled (master switch)
 *
 * TODO (future, do not block pilot):
 *   - Kakao Maps / Naver Maps geocoding of job + worker addresses.
 *   - PostGIS ST_DWithin radius matching against lat/lng instead of
 *     province/district string equality.
 *
 * Safe to call fire-and-forget; never throws.
 */
export async function notifyMatchingWorkers(jobId: string): Promise<number> {
  try {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      console.warn(`[notifications] job ${jobId} not found`);
      return 0;
    }

    const prefs = await prisma.notificationPreference.findMany({
      where: {
        enabled: true, // (7) master switch
        // (1) province match (or worker accepts all provinces)
        OR: [{ cities: { has: job.city } }, { cities: { isEmpty: true } }],
        AND: [
          {
            // (3) category match (or worker accepts all categories)
            OR: [
              { categories: { has: job.category } },
              { categories: { isEmpty: true } },
            ],
          },
          // (5) if worker only wants urgent alerts, the job must be urgent
          job.isUrgent ? {} : { urgentOnly: false },
        ],
      },
      include: { user: { include: { workerProfile: true } } },
    });

    const nightJob = isNightHour(job.startDateTime);
    const now = new Date();

    let sent = 0;
    for (const pref of prefs) {
      const profile = pref.user.workerProfile;

      // (2) district gate — only when both sides specify a district.
      if (job.district && profile?.preferredDistrict) {
        if (profile.preferredDistrict !== job.district) continue;
      }

      // (4) language gate — job requiring languages only reaches speakers.
      if (job.languagePreference.length > 0) {
        const spoken = profile?.languages ?? [];
        if (!job.languagePreference.some((l) => spoken.includes(l))) continue;
      }

      // (6) availability — UNAVAILABLE never matched; urgent jobs only reach
      // immediately-available workers (AVAILABLE_NOW/TODAY/TONIGHT).
      if (profile && !isAvailableForJob(profile.availabilityStatus, job.isUrgent)) {
        continue;
      }

      // Night-job opt-out (non-urgent night jobs only reach opted-in workers).
      if (nightJob && !job.isUrgent && !pref.nightJobsAllowed) continue;

      const locale = normalizeLocale(
        pref.user.preferredLocale ?? profile?.languages?.[0]
      );
      const title = job.isUrgent
        ? `🚨 ${translate("match.urgentJobTitle", locale)}`
        : translate("match.newJobTitle", locale);
      const body = `${job.title} · ${job.district ?? job.city} · ${formatJobSalary(job.salaryAmount, job.salaryType, locale)}`;

      // In-app notification (respects the per-channel toggle).
      if (pref.inAppEnabled) {
        await NotificationService.sendInternalNotification({
          userId: pref.userId,
          type: "NEW_MATCHING_JOB",
          title,
          body,
          jobId: job.id,
        });
      }

      // SMS — only with explicit consent, respecting quiet hours (urgent bypasses).
      const quiet = inQuietHours(pref.quietHoursStart, pref.quietHoursEnd, now);
      const smsAllowed =
        pref.smsEnabled && !!pref.smsConsentAt && (job.isUrgent || !quiet);
      if (smsAllowed) {
        const alertVars = {
          category: translate(`enums.category.${job.category}`, locale),
          district: job.district ?? job.city,
          salary: formatJobSalary(job.salaryAmount, job.salaryType, locale),
          startTime: formatDateTime(job.startDateTime, locale),
        };
        const sms = job.isUrgent
          ? smsUrgentJob(alertVars, locale)
          : smsNewMatchingJob(alertVars, locale);
        await NotificationService.sendSmsNotification(
          pref.userId,
          pref.user.phone,
          sms,
          "NEW_MATCHING_JOB",
          job.id
        );
      }
      sent++;
    }

    if (IS_DEV) {
      console.log(`[notifications] job "${job.title}" matched ${sent} worker(s)`);
    }
    return sent;
  } catch (e) {
    captureError(e, { operation: "notifications.notifyMatchingWorkers", jobId });
    return 0;
  }
}
