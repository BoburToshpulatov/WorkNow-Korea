/**
 * SMS message templates (Phase 4). Short, plain-text, locale-aware.
 * Fallback order: requested locale → en → ko.
 * No emoji: Korean carrier SMS/LMS is EUC-KR and cannot carry them.
 */
import type { Locale } from "@/lib/i18n";
import { env } from "@/lib/env";

/** Short job link for texts — `/j/<id>` routes through login if needed. */
export function smsJobLink(jobId: string): string {
  return `${env.appUrl.replace(/\/$/, "")}/j/${jobId}`;
}

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
  link: string;
}

export function smsNewMatchingJob(v: JobAlertVars, locale: Locale): string {
  return fill(
    pick(
      {
        ko: "[WorkNow] 새 일자리: {category}, {district}, {salary}, {startTime}\n{link}",
        en: "[WorkNow] New job: {category}, {district}, {salary}, {startTime}\n{link}",
        uz: "[WorkNow] Yangi ish: {category}, {district}, {salary}, {startTime}\n{link}",
      },
      locale
    ),
    v as unknown as Record<string, string>
  );
}

/** Urgent variant — leads with the urgency cue. */
export function smsUrgentJob(v: JobAlertVars, locale: Locale): string {
  return fill(
    pick(
      {
        ko: "[WorkNow] 긴급 모집: {category}, {district}, {salary}, {startTime}\n지금 확인: {link}",
        en: "[WorkNow] URGENT: {category}, {district}, {salary}, {startTime}\nView now: {link}",
        uz: "[WorkNow] Shoshilinch: {category}, {district}, {salary}, {startTime}\nHoziroq ko‘ring: {link}",
      },
      locale
    ),
    v as unknown as Record<string, string>
  );
}

/** Rehire invite from an employer the worker has worked with before. */
export function smsRehireInvite(
  v: { employerName: string; jobTitle: string; link: string },
  locale: Locale
): string {
  return fill(
    pick(
      {
        ko: "[WorkNow] {employerName}님이 다시 함께 일하자고 초대했습니다: {jobTitle}\n{link}",
        en: "[WorkNow] {employerName} invited you to work again: {jobTitle}\n{link}",
        uz: "[WorkNow] {employerName} sizni yana ishlashga taklif qildi: {jobTitle}\n{link}",
      },
      locale
    ),
    v
  );
}

export function smsNewInterest(
  v: { workerName: string; jobTitle: string; link: string },
  locale: Locale
): string {
  return fill(
    pick(
      {
        ko: "[WorkNow] 새 지원자: {workerName}님이 {jobTitle}에 관심을 표시했습니다. 연락하기: {link}",
        en: "[WorkNow] New applicant: {workerName} is interested in {jobTitle}. Contact: {link}",
        uz: "[WorkNow] Yangi nomzod: {workerName} {jobTitle} ishiga qiziqdi. Bog‘lanish: {link}",
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
