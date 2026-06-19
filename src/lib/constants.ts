export type CategoryValue =
  | "FACTORY"
  | "WAREHOUSE"
  | "FARM"
  | "CONSTRUCTION"
  | "CLEANING"
  | "RESTAURANT"
  | "LOADING"
  | "OTHER";

export interface CategoryDef {
  value: CategoryValue;
  label: string; // English (fallback / future i18n)
  labelKo: string; // Korean — primary UI
  icon: string;
}

export const JOB_CATEGORIES: CategoryDef[] = [
  { value: "FACTORY", label: "Factory", labelKo: "공장", icon: "🏭" },
  { value: "WAREHOUSE", label: "Warehouse", labelKo: "물류창고", icon: "📦" },
  { value: "FARM", label: "Farm", labelKo: "농장", icon: "🌾" },
  { value: "CONSTRUCTION", label: "Construction", labelKo: "건설", icon: "🏗️" },
  { value: "CLEANING", label: "Cleaning", labelKo: "청소", icon: "🧹" },
  { value: "RESTAURANT", label: "Restaurant", labelKo: "식당", icon: "🍽️" },
  { value: "LOADING", label: "Loading", labelKo: "상하차", icon: "🚚" },
  { value: "OTHER", label: "Other", labelKo: "기타", icon: "🔧" },
];

export const CATEGORY_MAP: Record<CategoryValue, CategoryDef> =
  JOB_CATEGORIES.reduce(
    (acc, c) => {
      acc[c.value] = c;
      return acc;
    },
    {} as Record<CategoryValue, CategoryDef>
  );

/** Korean label for a category value (primary UI helper). */
export function categoryLabel(value: string): string {
  return CATEGORY_MAP[value as CategoryValue]?.labelKo ?? value;
}

// ── Location (Phase 6) ──────────────────────────────────────────────
// Pilot focuses on Daegu / Busan / Incheon. Structure: 광역시/도 → 구/군.
// Architecture is ready for Kakao/Naver Maps geocoding + PostGIS radius later.
export interface RegionDef {
  province: string; // 광역시 / 도
  districts: string[]; // 구 / 군
}

export const KOREAN_REGIONS: RegionDef[] = [
  {
    province: "대구광역시",
    districts: [
      "중구",
      "동구",
      "서구",
      "남구",
      "북구",
      "수성구",
      "달서구",
      "달성군",
    ],
  },
  {
    province: "부산광역시",
    districts: [
      "중구",
      "서구",
      "동구",
      "영도구",
      "부산진구",
      "동래구",
      "남구",
      "북구",
      "해운대구",
      "사하구",
      "금정구",
      "강서구",
      "연제구",
      "수영구",
      "사상구",
      "기장군",
    ],
  },
  {
    province: "인천광역시",
    districts: [
      "중구",
      "동구",
      "미추홀구",
      "연수구",
      "남동구",
      "부평구",
      "계양구",
      "서구",
      "강화군",
      "옹진군",
    ],
  },
  {
    province: "서울특별시",
    districts: [
      "강남구",
      "강서구",
      "관악구",
      "구로구",
      "금천구",
      "동대문구",
      "영등포구",
      "송파구",
      "중구",
    ],
  },
];

export const PROVINCES: string[] = KOREAN_REGIONS.map((r) => r.province);

export function districtsForProvince(province: string): string[] {
  return KOREAN_REGIONS.find((r) => r.province === province)?.districts ?? [];
}

/** Legacy English city list kept for back-compat with older records. */
export const KOREAN_CITIES: string[] = [
  "대구광역시",
  "부산광역시",
  "인천광역시",
  "서울특별시",
];

// ── Languages (Phase 2) ─────────────────────────────────────────────
export interface LanguageDef {
  value: string;
  label: string;
  labelKo: string;
}

export const LANGUAGES: LanguageDef[] = [
  { value: "ko", label: "Korean", labelKo: "한국어" },
  { value: "uz", label: "Uzbek", labelKo: "우즈베크어" },
  { value: "ru", label: "Russian", labelKo: "러시아어" },
  { value: "en", label: "English", labelKo: "영어" },
  { value: "vi", label: "Vietnamese", labelKo: "베트남어" },
  { value: "ne", label: "Nepali", labelKo: "네팔어" },
  { value: "th", label: "Thai", labelKo: "태국어" },
  { value: "zh", label: "Chinese", labelKo: "중국어" },
];

export const LANGUAGE_MAP: Record<string, LanguageDef> = LANGUAGES.reduce(
  (acc, l) => {
    acc[l.value] = l;
    return acc;
  },
  {} as Record<string, LanguageDef>
);

/** Korean label for a language code; falls back to the raw code. */
export function languageLabel(value: string): string {
  return LANGUAGE_MAP[value]?.labelKo ?? value;
}

// "Any" sentinel for employer's required-language selector.
export const LANGUAGE_ANY = "ANY";

// ── Korean label maps (primary UI) ──────────────────────────────────
export const DURATION_TYPE_LABELS: Record<string, string> = {
  HOURLY: "시급제",
  DAILY: "일급제",
  MULTI_DAY: "단기(며칠)",
  MONTHLY: "월급제",
};

export const SALARY_TYPE_LABELS: Record<string, string> = {
  HOURLY: "시급",
  DAILY: "일당",
  MONTHLY: "월급",
  FIXED: "고정 금액",
};

export const PAYMENT_TIMING_LABELS: Record<string, string> = {
  SAME_DAY: "당일 지급",
  WEEKLY: "주급",
  MONTHLY: "월급",
  AFTER_COMPLETION: "업무 완료 후",
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  NOW: "지금 가능",
  TODAY: "오늘",
  TOMORROW: "내일",
  WEEKENDS: "주말",
  NIGHT: "야간",
};

export const TRANSPORT_LABELS: Record<string, string> = {
  WALK: "도보",
  BICYCLE: "자전거",
  MOTORCYCLE: "오토바이",
  CAR: "자가용",
  PUBLIC_TRANSIT: "대중교통",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  PENDING: "검토 중",
  OPEN: "모집 중",
  FILLED: "모집 완료",
  CANCELLED: "취소됨",
  REJECTED: "반려됨",
};

// ── Trust / verification (Phase 3) ──────────────────────────────────
export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  UNVERIFIED: "미인증",
  PENDING: "검토 중",
  VERIFIED: "인증 완료",
  REJECTED: "인증 반려",
};

// ── Interest / hiring lifecycle (Phase 4) ───────────────────────────
export const INTEREST_STATUS_LABELS: Record<string, string> = {
  INTERESTED: "관심 표시",
  CONTACTED: "연락함",
  HIRED: "채용 확정",
  COMPLETED: "근무 완료",
  NO_SHOW: "노쇼",
};

export const INTEREST_STATUS_FLOW = [
  "INTERESTED",
  "CONTACTED",
  "HIRED",
  "COMPLETED",
  "NO_SHOW",
] as const;

// ── Worker visa / eligibility (Phase 2) — self-declared, not legal advice ──
export const VISA_CATEGORIES = [
  "KOREAN_CITIZEN",
  "F_VISA",
  "E9",
  "H2",
  "D_VISA_STUDENT",
  "TOURIST_NOT_ELIGIBLE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;

// ── Reporting (Phase 4) ─────────────────────────────────────────────
export const REPORT_REASONS = [
  "FAKE_JOB",
  "UNPAID_WAGE",
  "UNSAFE_WORK",
  "WRONG_SALARY",
  "HARASSMENT",
  "SCAM_SPAM",
  "NO_SHOW",
  "OTHER",
] as const;

export const REPORT_STATUSES = [
  "OPEN",
  "REVIEWING",
  "RESOLVED",
  "DISMISSED",
] as const;

// ── Trust summary tiers (Phase 3) ───────────────────────────────────
export type TrustTier = "NEW" | "VERIFIED" | "RELIABLE" | "NEEDS_REVIEW";

export const DISCLAIMER_TEXT =
  "워크나우 코리아는 일자리 정보 제공 플랫폼입니다. 고용주와 근로자는 직접 연락하여 거래합니다. " +
  "당사는 근로자를 고용·파견·관리하지 않으며, 고용주와 근로자 간의 어떠한 계약의 당사자도 아닙니다. " +
  "채용, 급여, 근로 조건 또는 고용 관계를 보장하지 않습니다. " +
  "모든 내용은 상대방과 직접 확인하시고, 대한민국 노동 관계 법령을 준수해 주세요.";
