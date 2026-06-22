import { z } from "zod";

const phoneRegex = /^[0-9+\-\s()]{7,20}$/;

export const loginSchema = z.object({
  phone: z.string().regex(phoneRegex, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  phone: z.string().regex(phoneRegex, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["WORKER", "EMPLOYER"]),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  locale: z.enum(["ko", "en", "uz"]).optional(),
});

export const jobCategoryEnum = z.enum([
  "FACTORY",
  "WAREHOUSE",
  "FARM",
  "CONSTRUCTION",
  "CLEANING",
  "RESTAURANT",
  "LOADING",
  "OTHER",
]);

export const durationTypeEnum = z.enum([
  "HOURLY",
  "DAILY",
  "MULTI_DAY",
  "MONTHLY",
]);

export const salaryTypeEnum = z.enum(["HOURLY", "DAILY", "MONTHLY", "FIXED"]);

export const paymentTimingEnum = z.enum([
  "SAME_DAY",
  "WEEKLY",
  "MONTHLY",
  "AFTER_COMPLETION",
  "NEGOTIABLE",
]);

export const availabilityStatusEnum = z.enum([
  "AVAILABLE_NOW",
  "AVAILABLE_TODAY",
  "AVAILABLE_TONIGHT",
  "AVAILABLE_TOMORROW",
  "WEEKENDS_ONLY",
  "UNAVAILABLE",
]);

export const urgencyTypeEnum = z.enum([
  "WITHIN_2_HOURS",
  "TODAY",
  "TONIGHT",
  "FLEXIBLE",
]);

export const availabilityEnum = z.enum([
  "NOW",
  "TODAY",
  "TOMORROW",
  "WEEKENDS",
  "NIGHT",
]);

export const transportEnum = z.enum([
  "WALK",
  "BICYCLE",
  "MOTORCYCLE",
  "CAR",
  "PUBLIC_TRANSIT",
]);

export const jobSchema = z.object({
  title: z.string().min(3, "Title is too short").max(120),
  category: jobCategoryEnum,
  description: z.string().min(10, "Please describe the job").max(4000),
  address: z.string().min(3, "Address is required"),
  province: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "City is required"),
  district: z.string().optional().or(z.literal("")),
  region: z.string().min(1, "Region is required"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  startDateTime: z.coerce.date(),
  durationType: durationTypeEnum,
  durationDetails: z.string().min(1, "Duration details are required"),
  workersNeeded: z.coerce.number().int().min(1).max(500),
  salaryAmount: z.coerce.number().int().min(0),
  salaryType: salaryTypeEnum,
  paymentTiming: paymentTimingEnum,
  requiredSkills: z.array(z.string()).default([]),
  languagePreference: z.array(z.string()).default([]),
  visaNote: z.string().optional().or(z.literal("")),
  contactPhone: z.string().regex(phoneRegex, "Enter a valid phone number"),
  kakaoId: z.string().optional().or(z.literal("")),
  isUrgent: z.boolean().default(false),
  urgencyType: urgencyTypeEnum.optional().nullable(),
  locationNote: z.string().optional().or(z.literal("")),
  nearPublicTransport: z.boolean().default(false),
  parkingAvailable: z.boolean().default(false),
  shuttleProvided: z.boolean().default(false),
  pickupAvailable: z.boolean().default(false),
  transportNote: z.string().optional().or(z.literal("")),
  safetyNotes: z.string().optional().or(z.literal("")),
});

// Phase 4 — Quick post: only the essentials. The API fills sensible defaults
// for the remaining required Job fields.
export const quickJobSchema = z.object({
  category: jobCategoryEnum,
  province: z.string().min(1),
  city: z.string().min(1, "지역을 선택하세요"),
  district: z.string().min(1, "구/군을 선택하세요"),
  startDateTime: z.coerce.date(),
  salaryAmount: z.coerce.number().int().min(0),
  salaryType: salaryTypeEnum,
  workersNeeded: z.coerce.number().int().min(1).max(500),
  contactPhone: z.string().regex(phoneRegex, "Enter a valid phone number"),
  isUrgent: z.boolean().default(false),
});

export const workerProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  preferredCity: z.string().min(1, "Preferred city is required"),
  preferredProvince: z.string().optional().or(z.literal("")),
  preferredDistrict: z.string().optional().or(z.literal("")),
  preferredRadius: z.coerce.number().int().min(1).max(200).default(10),
  currentLatitude: z.coerce.number().optional().nullable(),
  currentLongitude: z.coerce.number().optional().nullable(),
  availabilityStatus: availabilityStatusEnum.default("AVAILABLE_TODAY"),
  languages: z.array(z.string()).default([]),
  categories: z.array(jobCategoryEnum).default([]),
  availability: z.array(availabilityEnum).default([]),
  transport: transportEnum.default("PUBLIC_TRANSIT"),
  experience: z.string().optional().or(z.literal("")),
  visaNote: z.string().optional().or(z.literal("")),
  nationality: z.string().optional().or(z.literal("")),
  visaCategory: z
    .enum([
      "KOREAN_CITIZEN",
      "F_VISA",
      "E9",
      "H2",
      "D_VISA_STUDENT",
      "TOURIST_NOT_ELIGIBLE",
      "OTHER",
      "PREFER_NOT_TO_SAY",
    ])
    .optional()
    .or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
});

export const employerProfileSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  representativeName: z.string().optional().or(z.literal("")),
  businessAddress: z.string().optional().or(z.literal("")),
  // 사업자등록번호: 10 digits, dashes optional.
  businessRegistrationNumber: z
    .string()
    .regex(/^[0-9-]{10,12}$/, "사업자등록번호 10자리를 입력하세요")
    .optional()
    .or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
});

export const notificationPrefSchema = z.object({
  cities: z.array(z.string()).default([]),
  radius: z.coerce.number().int().min(1).max(200).default(10),
  categories: z.array(jobCategoryEnum).default([]),
  urgentOnly: z.boolean().default(false),
  enabled: z.boolean().default(true),
  inAppEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  pushEnabled: z.boolean().default(false),
  nightJobsAllowed: z.boolean().default(true),
  quietHoursStart: z.coerce.number().int().min(0).max(23).optional().nullable(),
  quietHoursEnd: z.coerce.number().int().min(0).max(23).optional().nullable(),
});

export const interestSchema = z.object({
  message: z.string().max(500).optional().or(z.literal("")),
});

// One-click worker availability update (matching engine).
export const availabilityUpdateSchema = z.object({
  availabilityStatus: availabilityStatusEnum,
});

// Employer rehire invite (matching engine).
export const rehireSchema = z.object({
  workerUserId: z.string().min(1),
  jobId: z.string().min(1),
});

export const reportReasonEnum = z.enum([
  "FAKE_JOB",
  "UNPAID_WAGE",
  "UNSAFE_WORK",
  "WRONG_SALARY",
  "HARASSMENT",
  "SCAM_SPAM",
  "NO_SHOW",
  "OTHER",
]);

export const reportSchema = z.object({
  jobId: z.string().optional(),
  reasonCode: reportReasonEnum.default("OTHER"),
  reason: z.string().min(1, "Please choose a reason").max(120),
  details: z.string().max(1000).optional().or(z.literal("")),
});

// Reviews (reputation) — only after a COMPLETED job.
export const reviewSchema = z.object({
  jobId: z.string().min(1),
  revieweeId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional().or(z.literal("")),
});

// Phase 4 — admin report moderation
export const reportModerationSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"]),
  adminNote: z.string().max(1000).optional().or(z.literal("")),
});

export const adminJobStatusSchema = z.object({
  status: z.enum(["PENDING", "OPEN", "FILLED", "CANCELLED", "REJECTED"]),
});

// Phase 4 — employer updates an applicant's lifecycle status.
export const interestStatusSchema = z.object({
  interestId: z.string().min(1),
  status: z.enum(["INTERESTED", "CONTACTED", "HIRED", "COMPLETED", "NO_SHOW"]),
});

// Phase 3 — admin sets a worker/employer verification status.
export const verificationSchema = z.object({
  target: z.enum(["WORKER", "EMPLOYER"]),
  profileId: z.string().min(1),
  status: z.enum([
    "UNVERIFIED",
    "PENDING",
    "VERIFIED",
    "REJECTED",
    "NEEDS_MORE_INFO",
  ]),
  note: z.string().max(1000).optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type JobInput = z.infer<typeof jobSchema>;
export type WorkerProfileInput = z.infer<typeof workerProfileSchema>;
export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;
export type NotificationPrefInput = z.infer<typeof notificationPrefSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type QuickJobInput = z.infer<typeof quickJobSchema>;
