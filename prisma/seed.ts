import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding WorkNow Korea…");

  // Clean slate (order matters for FKs)
  await prisma.notification.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.jobInterest.deleteMany();
  await prisma.savedJob.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.report.deleteMany();
  await prisma.job.deleteMany();
  await prisma.employerProfile.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subscriptionPlan.deleteMany();

  const pw = (p: string) => bcrypt.hash(p, 10);

  // ── Admin ──
  await prisma.user.create({
    data: {
      phone: "010-0000-0000",
      password: await pw("admin123"),
      role: "ADMIN",
      email: "admin@worknow.kr",
    },
  });

  // ── Employers (Daegu / Busan / Incheon) ──
  const employerData = [
    {
      phone: "010-1111-1111",
      name: "한일식품 (주)",
      businessType: "식품 제조",
      province: "대구광역시",
      city: "대구광역시",
      district: "달서구",
      brn: "123-45-67890",
      verificationStatus: "VERIFIED" as const,
    },
    {
      phone: "010-2222-2222",
      name: "푸른들 농장",
      businessType: "농업",
      province: "부산광역시",
      city: "부산광역시",
      district: "강서구",
      brn: "222-33-44455",
      verificationStatus: "VERIFIED" as const,
    },
    {
      phone: "010-3333-3333",
      name: "인천항 물류센터",
      businessType: "물류/창고",
      province: "인천광역시",
      city: "인천광역시",
      district: "연수구",
      brn: null,
      verificationStatus: "PENDING" as const,
    },
  ];

  const employers = [];
  for (const e of employerData) {
    const user = await prisma.user.create({
      data: {
        phone: e.phone,
        password: await pw("password123"),
        role: "EMPLOYER",
        employerProfile: {
          create: {
            name: e.name,
            businessType: e.businessType,
            province: e.province,
            city: e.city,
            district: e.district,
            businessRegistrationNumber: e.brn,
            verificationStatus: e.verificationStatus,
          },
        },
      },
      include: { employerProfile: true },
    });
    employers.push({ profile: user.employerProfile!, phone: e.phone });
  }

  // ── Workers ──
  const workerData = [
    {
      phone: "010-4444-0001",
      name: "김민준",
      province: "대구광역시",
      city: "대구광역시",
      district: "달서구",
      languages: ["ko"],
      categories: ["RESTAURANT", "CLEANING"] as const,
      availability: ["TODAY", "WEEKENDS"] as const,
      transport: "PUBLIC_TRANSIT" as const,
      verificationStatus: "VERIFIED" as const,
    },
    {
      phone: "010-4444-0002",
      name: "Aziz Karimov",
      province: "대구광역시",
      city: "대구광역시",
      district: "북구",
      languages: ["uz", "ru", "ko"],
      categories: ["FACTORY", "WAREHOUSE", "LOADING"] as const,
      availability: ["NOW", "NIGHT"] as const,
      transport: "BICYCLE" as const,
      verificationStatus: "VERIFIED" as const,
    },
    {
      phone: "010-4444-0003",
      name: "Ivan Petrov",
      province: "인천광역시",
      city: "인천광역시",
      district: "남동구",
      languages: ["ru", "en"],
      categories: ["CONSTRUCTION", "LOADING"] as const,
      availability: ["TOMORROW"] as const,
      transport: "CAR" as const,
      verificationStatus: "PENDING" as const,
    },
    {
      phone: "010-4444-0004",
      name: "Nguyen Van An",
      province: "부산광역시",
      city: "부산광역시",
      district: "사상구",
      languages: ["vi", "ko"],
      categories: ["FARM", "FACTORY"] as const,
      availability: ["NOW", "TODAY"] as const,
      transport: "MOTORCYCLE" as const,
      verificationStatus: "UNVERIFIED" as const,
    },
    {
      phone: "010-4444-0005",
      name: "Bishal Thapa",
      province: "부산광역시",
      city: "부산광역시",
      district: "해운대구",
      languages: ["ne", "en", "ko"],
      categories: ["RESTAURANT", "CLEANING", "OTHER"] as const,
      availability: ["WEEKENDS", "NIGHT"] as const,
      transport: "WALK" as const,
      verificationStatus: "UNVERIFIED" as const,
    },
  ];

  const workers = [];
  for (const w of workerData) {
    const user = await prisma.user.create({
      data: {
        phone: w.phone,
        password: await pw("password123"),
        role: "WORKER",
        workerProfile: {
          create: {
            name: w.name,
            preferredCity: w.city,
            preferredProvince: w.province,
            preferredDistrict: w.district,
            preferredRadius: 15,
            languages: w.languages,
            categories: [...w.categories],
            availability: [...w.availability],
            transport: w.transport,
            verificationStatus: w.verificationStatus,
            bio: `${w.name} — ${w.city} 지역에서 성실히 일하는 근로자입니다.`,
          },
        },
        notificationPrefs: {
          create: {
            cities: [w.city],
            radius: 15,
            categories: [...w.categories],
            urgentOnly: false,
            emailEnabled: true,
          },
        },
      },
      include: { workerProfile: true },
    });
    workers.push(user);
  }

  // ── Jobs — realistic Korean listings ──
  type SeedJob = {
    e: number; // employer index
    title: string;
    category:
      | "FACTORY"
      | "WAREHOUSE"
      | "FARM"
      | "CONSTRUCTION"
      | "CLEANING"
      | "RESTAURANT"
      | "LOADING"
      | "OTHER";
    province: string;
    city: string;
    district: string;
    address: string;
    salaryAmount: number;
    salaryType: "HOURLY" | "DAILY" | "MONTHLY" | "FIXED";
    paymentTiming: "SAME_DAY" | "WEEKLY" | "MONTHLY" | "AFTER_COMPLETION";
    durationType: "HOURLY" | "DAILY" | "MULTI_DAY" | "MONTHLY";
    durationDetails: string;
    workersNeeded: number;
    languagePreference: string[];
    isUrgent: boolean;
    status: "OPEN" | "PENDING" | "FILLED";
    description: string;
    safetyNotes?: string | null;
    visaNote?: string | null;
  };

  const jobList: SeedJob[] = [
    {
      e: 0,
      title: "식품 공장 포장 라인 작업자 (주간)",
      category: "FACTORY",
      province: "대구광역시",
      city: "대구광역시",
      district: "달서구",
      address: "성서공단로 123",
      salaryAmount: 110000,
      salaryType: "DAILY",
      paymentTiming: "SAME_DAY",
      durationType: "DAILY",
      durationDetails: "1일 8시간 (09:00~18:00)",
      workersNeeded: 5,
      languagePreference: ["ko"],
      isUrgent: true,
      status: "OPEN",
      description:
        "식품 포장 라인에서 제품 포장 및 정리 업무를 담당합니다. 초보자도 가능하며 현장 교육을 제공합니다. 당일 일당 지급.",
      safetyNotes: "위생모, 위생장갑 착용 필수 (현장 제공).",
    },
    {
      e: 0,
      title: "야간 물류 상하차 (단기 3일)",
      category: "LOADING",
      province: "대구광역시",
      city: "대구광역시",
      district: "북구",
      address: "유통단지로 45",
      salaryAmount: 130000,
      salaryType: "DAILY",
      paymentTiming: "SAME_DAY",
      durationType: "MULTI_DAY",
      durationDetails: "야간 22:00~06:00, 3일간",
      workersNeeded: 8,
      languagePreference: ["ko", "uz", "ru"],
      isUrgent: true,
      status: "OPEN",
      description:
        "물류센터 야간 상하차 업무입니다. 체력이 좋은 분 환영합니다. 외국인 근로자 지원 가능 (취업 가능 비자 필수).",
      visaNote: "취업 가능 비자 보유자 환영",
      safetyNotes: "안전화 착용 권장.",
    },
    {
      e: 0,
      title: "공장 청소 및 정리 (주말)",
      category: "CLEANING",
      province: "대구광역시",
      city: "대구광역시",
      district: "달서구",
      address: "성서공단로 200",
      salaryAmount: 12000,
      salaryType: "HOURLY",
      paymentTiming: "WEEKLY",
      durationType: "HOURLY",
      durationDetails: "주말 1일 6시간",
      workersNeeded: 3,
      languagePreference: ["ko"],
      isUrgent: false,
      status: "OPEN",
      description: "공장 내부 청소 및 자재 정리 업무. 주말 근무 가능자.",
    },
    {
      e: 1,
      title: "딸기 농장 수확 보조",
      category: "FARM",
      province: "부산광역시",
      city: "부산광역시",
      district: "강서구",
      address: "대저로 77",
      salaryAmount: 100000,
      salaryType: "DAILY",
      paymentTiming: "SAME_DAY",
      durationType: "DAILY",
      durationDetails: "1일 8시간 (07:00~16:00)",
      workersNeeded: 10,
      languagePreference: ["ko", "vi"],
      isUrgent: true,
      status: "OPEN",
      description:
        "비닐하우스 딸기 수확 및 선별 작업입니다. 숙련도와 무관하게 지원 가능합니다. 점심 제공.",
      visaNote: "취업 가능 비자 보유자 환영",
    },
    {
      e: 1,
      title: "농산물 선별 및 포장 (월급)",
      category: "FARM",
      province: "부산광역시",
      city: "부산광역시",
      district: "강서구",
      address: "대저로 90",
      salaryAmount: 2400000,
      salaryType: "MONTHLY",
      paymentTiming: "MONTHLY",
      durationType: "MONTHLY",
      durationDetails: "주 5일, 1일 8시간",
      workersNeeded: 4,
      languagePreference: ["ko", "vi"],
      isUrgent: false,
      status: "OPEN",
      description: "농산물 선별·포장 정규직. 성실한 분 우대. 기숙사 제공 가능.",
    },
    {
      e: 1,
      title: "비닐하우스 설치 보조",
      category: "CONSTRUCTION",
      province: "부산광역시",
      city: "부산광역시",
      district: "강서구",
      address: "대저로 120",
      salaryAmount: 150000,
      salaryType: "DAILY",
      paymentTiming: "AFTER_COMPLETION",
      durationType: "MULTI_DAY",
      durationDetails: "1일 8시간, 5일간",
      workersNeeded: 6,
      languagePreference: ["ko"],
      isUrgent: false,
      status: "PENDING",
      description: "비닐하우스 골조 설치 보조 업무. 건설 경험자 우대.",
      safetyNotes: "안전모·안전화 착용 필수 (현장 제공).",
    },
    {
      e: 2,
      title: "항만 컨테이너 상하차 (긴급)",
      category: "LOADING",
      province: "인천광역시",
      city: "인천광역시",
      district: "연수구",
      address: "송도국제대로 30",
      salaryAmount: 140000,
      salaryType: "DAILY",
      paymentTiming: "SAME_DAY",
      durationType: "DAILY",
      durationDetails: "1일 8시간 (08:00~17:00)",
      workersNeeded: 12,
      languagePreference: ["ko", "ru", "en"],
      isUrgent: true,
      status: "OPEN",
      description:
        "항만 물류센터 컨테이너 상하차 작업입니다. 당일 지급, 체력 좋은 분 환영.",
      visaNote: "취업 가능 비자 보유자 환영",
      safetyNotes: "안전화·안전모 착용 필수.",
    },
    {
      e: 2,
      title: "창고 재고 정리 및 피킹",
      category: "WAREHOUSE",
      province: "인천광역시",
      city: "인천광역시",
      district: "남동구",
      address: "남동대로 15",
      salaryAmount: 11500,
      salaryType: "HOURLY",
      paymentTiming: "WEEKLY",
      durationType: "HOURLY",
      durationDetails: "1일 8시간, 주 5일",
      workersNeeded: 6,
      languagePreference: ["ko"],
      isUrgent: false,
      status: "OPEN",
      description: "물류창고 재고 정리 및 상품 피킹 업무. 초보자 가능.",
    },
    {
      e: 2,
      title: "물류센터 식당 주방 보조",
      category: "RESTAURANT",
      province: "인천광역시",
      city: "인천광역시",
      district: "연수구",
      address: "송도국제대로 50",
      salaryAmount: 12000,
      salaryType: "HOURLY",
      paymentTiming: "MONTHLY",
      durationType: "MONTHLY",
      durationDetails: "1일 6시간 (10:00~16:00)",
      workersNeeded: 2,
      languagePreference: ["ko"],
      isUrgent: false,
      status: "FILLED",
      description: "구내식당 주방 보조 및 설거지. 친절하고 성실한 분.",
    },
    {
      e: 0,
      title: "한식당 홀 서빙 (저녁)",
      category: "RESTAURANT",
      province: "대구광역시",
      city: "대구광역시",
      district: "수성구",
      address: "달구벌대로 500",
      salaryAmount: 12500,
      salaryType: "HOURLY",
      paymentTiming: "WEEKLY",
      durationType: "DAILY",
      durationDetails: "저녁 17:00~22:00",
      workersNeeded: 3,
      languagePreference: ["ko"],
      isUrgent: false,
      status: "OPEN",
      description: "한식당 홀 서빙 및 정리. 저녁 시간대 근무 가능자.",
    },
    {
      e: 1,
      title: "건설 현장 정리 일용직 (긴급)",
      category: "CONSTRUCTION",
      province: "부산광역시",
      city: "부산광역시",
      district: "사상구",
      address: "사상로 88",
      salaryAmount: 160000,
      salaryType: "DAILY",
      paymentTiming: "SAME_DAY",
      durationType: "DAILY",
      durationDetails: "1일 8시간 (07:00~16:00)",
      workersNeeded: 5,
      languagePreference: ["ko"],
      isUrgent: true,
      status: "OPEN",
      description: "건설 현장 자재 정리 및 청소. 당일 일당 현금 지급.",
      safetyNotes: "안전모·안전화 착용 필수 (현장 제공).",
    },
    {
      e: 2,
      title: "사무실 입주 청소 (단기)",
      category: "CLEANING",
      province: "인천광역시",
      city: "인천광역시",
      district: "부평구",
      address: "부평대로 22",
      salaryAmount: 120000,
      salaryType: "DAILY",
      paymentTiming: "SAME_DAY",
      durationType: "MULTI_DAY",
      durationDetails: "1일 7시간, 2일간",
      workersNeeded: 4,
      languagePreference: ["ko", "ne"],
      isUrgent: false,
      status: "OPEN",
      description: "신축 사무실 입주 청소. 꼼꼼한 분 환영.",
    },
  ];

  const createdJobs: { id: string; status: string }[] = [];
  for (const j of jobList) {
    const emp = employers[j.e];
    const job = await prisma.job.create({
      data: {
        employerId: emp.profile.id,
        title: j.title,
        category: j.category,
        description: j.description,
        address: j.address,
        country: "South Korea",
        province: j.province,
        city: j.city,
        district: j.district,
        region: j.district,
        startDateTime: new Date(Date.now() + (createdJobs.length + 1) * 86400000),
        durationType: j.durationType,
        durationDetails: j.durationDetails,
        workersNeeded: j.workersNeeded,
        salaryAmount: j.salaryAmount,
        salaryType: j.salaryType,
        paymentTiming: j.paymentTiming,
        requiredSkills: [],
        languagePreference: j.languagePreference,
        visaNote: j.visaNote ?? null,
        contactPhone: emp.phone,
        kakaoId: `worknow_${j.e}`,
        isUrgent: j.isUrgent,
        safetyNotes: j.safetyNotes ?? null,
        status: j.status,
      },
    });
    createdJobs.push(job);
  }

  // ── Pilot-scale top-up: reach ~20 employers, ~100 workers, ~50 jobs ──
  // Realistic distribution across Daegu/Busan/Incheon. One shared password
  // hash for generated accounts keeps the seed fast.
  const genPw = await pw("password123");
  const REGIONS = [
    { city: "대구광역시", districts: ["달서구", "북구", "수성구", "동구"] },
    { city: "부산광역시", districts: ["사상구", "강서구", "해운대구", "사하구"] },
    { city: "인천광역시", districts: ["남동구", "연수구", "부평구", "서구"] },
  ];
  const CATS = ["WAREHOUSE", "FACTORY", "FARM", "LOADING", "RESTAURANT", "CLEANING"] as const;
  const LANGS = [["ko"], ["ko", "uz"], ["ko", "vi"], ["ko", "ru"], ["ko", "ne"]];
  const AVAIL = [["NOW"], ["TODAY"], ["NOW", "NIGHT"], ["WEEKENDS"], ["TOMORROW"]] as const;
  const VERIF = ["VERIFIED", "VERIFIED", "PENDING", "UNVERIFIED"] as const;
  const pick = <T,>(arr: readonly T[], i: number) => arr[i % arr.length];

  // Employers 4..20
  for (let i = 4; i <= 20; i++) {
    const r = REGIONS[i % REGIONS.length];
    const phone = `010-1${String(i).padStart(3, "0")}-0000`;
    const u = await prisma.user.create({
      data: {
        phone,
        password: genPw,
        role: "EMPLOYER",
        employerProfile: {
          create: {
            name: `${r.city.slice(0, 2)} 파일럿 업체 ${i}`,
            businessType: pick(["제조", "물류", "농업", "외식", "청소"], i),
            province: r.city,
            city: r.city,
            district: pick(r.districts, i),
            verificationStatus: pick(VERIF, i),
          },
        },
      },
      include: { employerProfile: true },
    });
    employers.push({ profile: u.employerProfile!, phone });
  }

  // Workers 6..100
  for (let i = 6; i <= 100; i++) {
    const r = REGIONS[i % REGIONS.length];
    const phone = `010-4${String(i).padStart(3, "0")}-0000`;
    const u = await prisma.user.create({
      data: {
        phone,
        password: genPw,
        role: "WORKER",
        workerProfile: {
          create: {
            name: `근로자 ${i}`,
            preferredCity: r.city,
            preferredProvince: r.city,
            preferredDistrict: pick(r.districts, i),
            preferredRadius: 15,
            languages: pick(LANGS, i),
            categories: [pick(CATS, i), pick(CATS, i + 2)],
            availability: [...pick(AVAIL, i)],
            transport: pick(["WALK", "BICYCLE", "PUBLIC_TRANSIT", "MOTORCYCLE"] as const, i),
            verificationStatus: pick(VERIF, i),
          },
        },
        notificationPrefs: {
          create: {
            cities: [r.city],
            radius: 15,
            categories: [pick(CATS, i)],
            urgentOnly: i % 5 === 0,
          },
        },
      },
      include: { workerProfile: true },
    });
    workers.push(u);
  }

  // Jobs up to ~50 total
  const SAL = [
    { amount: 110000, type: "DAILY" as const },
    { amount: 12000, type: "HOURLY" as const },
    { amount: 130000, type: "DAILY" as const },
    { amount: 2400000, type: "MONTHLY" as const },
  ];
  for (let i = createdJobs.length; i < 50; i++) {
    const emp = employers[i % employers.length];
    const r = REGIONS[i % REGIONS.length];
    const cat = pick(CATS, i);
    const sal = pick(SAL, i);
    const status = pick(["OPEN", "OPEN", "OPEN", "FILLED", "PENDING"] as const, i);
    const job = await prisma.job.create({
      data: {
        employerId: emp.profile.id,
        title: `${cat === "WAREHOUSE" ? "물류창고" : cat === "FACTORY" ? "공장" : cat === "FARM" ? "농장" : cat === "LOADING" ? "상하차" : cat === "RESTAURANT" ? "식당" : "청소"} 근무자 모집 ${i}`,
        category: cat,
        description: "파일럿 데모 공고입니다. 자세한 내용은 고용주에게 문의하세요.",
        address: `${pick(r.districts, i)} 일대`,
        country: "South Korea",
        province: r.city,
        city: r.city,
        district: pick(r.districts, i),
        region: pick(r.districts, i),
        startDateTime: new Date(Date.now() + (i + 1) * 43200000),
        durationType: sal.type === "MONTHLY" ? "MONTHLY" : sal.type === "HOURLY" ? "HOURLY" : "DAILY",
        durationDetails: "1일 8시간",
        workersNeeded: 1 + (i % 5),
        salaryAmount: sal.amount,
        salaryType: sal.type,
        paymentTiming: i % 3 === 0 ? "SAME_DAY" : "WEEKLY",
        requiredSkills: [],
        languagePreference: pick(LANGS, i),
        contactPhone: emp.phone,
        kakaoId: null,
        isUrgent: i % 4 === 0,
        status,
      },
    });
    createdJobs.push(job);
  }

  // ── Interests & saved (only on OPEN jobs) ──
  const openJobs = createdJobs.filter((j) => j.status === "OPEN");
  for (let i = 0; i < openJobs.length; i++) {
    const worker = workers[i % workers.length];
    await prisma.jobInterest.create({
      data: {
        jobId: openJobs[i].id,
        userId: worker.id,
        message: i % 2 === 0 ? "지금 바로 근무 가능합니다." : null,
        status: i % 4 === 0 ? "CONTACTED" : "INTERESTED",
      },
    });
    if (i % 2 === 0) {
      await prisma.savedJob.create({
        data: {
          jobId: openJobs[i].id,
          userId: workers[(i + 1) % workers.length].id,
        },
      });
    }
  }

  // A couple of COMPLETED jobs so trust tiers ("Reliable") have data.
  if (openJobs.length >= 2) {
    await prisma.jobInterest.updateMany({
      where: { jobId: { in: [openJobs[0].id, openJobs[1].id] } },
      data: { status: "COMPLETED" },
    });
  }

  // ── A demo report (so the admin reports queue isn't empty) ──
  if (openJobs.length > 0) {
    await prisma.report.create({
      data: {
        reporterId: workers[0].id,
        jobId: openJobs[openJobs.length - 1].id,
        reasonCode: "WRONG_SALARY",
        reason: "급여 불일치",
        details: "공고 급여와 실제 안내가 다릅니다.",
        status: "OPEN",
      },
    });
  }

  // ── Subscription plans (₩) ──
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: "스타터",
        price: 0,
        jobsPerMonth: 1,
        features: ["월 1건 무료 등록", "기본 지원자 목록"],
      },
      {
        name: "스몰 비즈니스",
        price: 29000,
        jobsPerMonth: 10,
        features: ["월 10건 등록", "지원자 연락", "지역 알림"],
      },
      {
        name: "프로",
        price: 79000,
        jobsPerMonth: 40,
        features: ["월 40건 등록", "상단 노출", "인증 배지"],
      },
      {
        name: "엔터프라이즈",
        price: 149000,
        jobsPerMonth: 9999,
        features: ["무제한 등록", "다중 사업장", "전담 지원"],
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Admin: 010-0000-0000 / admin123");
  console.log("Employer: 010-1111-1111 / password123");
  console.log("Worker: 010-4444-0001 / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
