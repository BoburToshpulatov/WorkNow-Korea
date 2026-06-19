/**
 * SMS message templates (Phase 4). Short, plain-text, locale-aware.
 * Fallback order: requested locale → en → ko.
 */
import type { Locale } from "@/lib/i18n";

type Lset = { ko: string; en: string; uz?: string };

function pick(set: Lset, locale: Locale): string {
  if (locale === "uz") return set.uz ?? set.en ?? set.ko;
  if (locale === "en") return set.en ?? set.ko;
  return set.ko;
}

function fill(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export interface JobAlertVars {
  category: string;
  district: string;
  salary: string;
  startTime: string;
}

export function smsNewMatchingJob(v: JobAlertVars, locale: Locale): string {
  return fill(
    pick(
      {
        ko: "[WorkNow] 새 일자리: {category}, {district}, {salary}, {startTime}. 앱에서 확인하세요.",
        en: "[WorkNow] New job: {category}, {district}, {salary}, {startTime}. Open the app to view.",
        uz: "[WorkNow] Yangi ish: {category}, {district}, {salary}, {startTime}. Ilovada ko‘ring.",
      },
      locale
    ),
    v as unknown as Record<string, string>
  );
}

export function smsNewInterest(
  v: { workerName: string; jobTitle: string },
  locale: Locale
): string {
  // Employer-facing — Uzbek not required; defaults to KO/EN.
  return fill(
    pick(
      {
        ko: "[WorkNow] 새 지원자: {workerName}님이 {jobTitle}에 관심을 표시했습니다.",
        en: "[WorkNow] New applicant: {workerName} is interested in {jobTitle}.",
      },
      locale
    ),
    v
  );
}

export function smsVerificationUpdate(approved: boolean, locale: Locale): string {
  return pick(
    approved
      ? {
          ko: "[WorkNow] 인증이 완료되었습니다.",
          en: "[WorkNow] Your verification is complete.",
          uz: "[WorkNow] Tasdiqlash yakunlandi.",
        }
      : {
          ko: "[WorkNow] 인증 상태가 변경되었습니다. 앱에서 확인하세요.",
          en: "[WorkNow] Your verification status changed. Open the app.",
          uz: "[WorkNow] Tasdiqlash holati o‘zgardi. Ilovani oching.",
        },
    locale
  );
}

/** Opt-out hint appended where appropriate. */
export function smsOptOut(locale: Locale): string {
  return pick(
    {
      ko: "수신거부: 앱 알림 설정",
      en: "Opt out: app alert settings",
      uz: "Bekor qilish: ilova sozlamalari",
    },
    locale
  );
}
