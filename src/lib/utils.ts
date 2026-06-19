import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SalaryTypeKey = "HOURLY" | "DAILY" | "MONTHLY" | "FIXED";

// Korean salary convention: type prefix + amount + 원 (e.g. "일당 120,000원").
const SALARY_PREFIX: Record<SalaryTypeKey, string> = {
  HOURLY: "시급",
  DAILY: "일당",
  MONTHLY: "월급",
  FIXED: "",
};

export function formatSalary(amount: number, type: SalaryTypeKey): string {
  const formatted = new Intl.NumberFormat("ko-KR").format(amount);
  const prefix = SALARY_PREFIX[type] ?? "";
  return prefix ? `${prefix} ${formatted}원` : `${formatted}원`;
}

export function formatDate(
  date: Date | string,
  pattern = "yyyy년 M월 d일 (EEE) a h:mm"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern, { locale: ko });
}

export function formatRelativeTime(
  date: Date | string,
  locale: "ko" | "en" | "uz" = "ko"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: locale === "en" ? enUS : ko,
  });
}
