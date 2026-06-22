/**
 * Matching verification script (Phase 3).
 * Run: npm run test:matching
 *
 * Sets up isolated test data (phones prefixed 010-9999-*), runs
 * notifyMatchingWorkers, asserts who received an in-app notification, then
 * cleans up. Exits non-zero on any failed assertion.
 */
import { PrismaClient } from "@prisma/client";
import { notifyMatchingWorkers } from "../../src/lib/notifications";

const prisma = new PrismaClient();
const TAG = "010-9999-";

let failures = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}`);
    failures++;
  }
}

async function countNotifs(userId: string, jobId: string) {
  return prisma.notification.count({ where: { userId, jobId } });
}

async function cleanup() {
  // Remove anything created by this script (cascades to profiles/prefs/notifs).
  await prisma.job.deleteMany({ where: { employer: { user: { phone: { startsWith: TAG } } } } });
  await prisma.user.deleteMany({ where: { phone: { startsWith: TAG } } });
}

async function makeWorker(opts: {
  phone: string;
  district: string;
  languages: string[];
  urgentOnly: boolean;
  availability?: ("NOW" | "TODAY" | "TOMORROW" | "WEEKENDS" | "NIGHT")[];
  availabilityStatus?:
    | "AVAILABLE_NOW"
    | "AVAILABLE_TODAY"
    | "AVAILABLE_TONIGHT"
    | "AVAILABLE_TOMORROW"
    | "WEEKENDS_ONLY"
    | "UNAVAILABLE";
  enabled?: boolean;
}) {
  const user = await prisma.user.create({
    data: {
      phone: opts.phone,
      password: "x",
      role: "WORKER",
      workerProfile: {
        create: {
          name: opts.phone,
          preferredCity: "대구광역시",
          preferredProvince: "대구광역시",
          preferredDistrict: opts.district,
          languages: opts.languages,
          categories: ["FACTORY"],
          availability: opts.availability ?? [],
          availabilityStatus: opts.availabilityStatus ?? "AVAILABLE_TODAY",
        },
      },
      notificationPrefs: {
        create: {
          cities: ["대구광역시"],
          categories: ["FACTORY"],
          urgentOnly: opts.urgentOnly,
          enabled: opts.enabled ?? true,
        },
      },
    },
  });
  return user.id;
}

async function main() {
  await cleanup();

  const employer = await prisma.user.create({
    data: {
      phone: TAG + "0000",
      password: "x",
      role: "EMPLOYER",
      employerProfile: {
        create: { name: "Test Co", businessType: "Test", city: "대구광역시" },
      },
    },
    include: { employerProfile: true },
  });
  const empId = employer.employerProfile!.id;

  const baseJob = {
    employerId: empId,
    description: "test",
    address: "test",
    city: "대구광역시",
    district: "달서구",
    region: "달서구",
    startDateTime: new Date(),
    durationType: "DAILY" as const,
    durationDetails: "8h",
    workersNeeded: 1,
    salaryAmount: 120000,
    salaryType: "DAILY" as const,
    paymentTiming: "SAME_DAY" as const,
    contactPhone: TAG + "0000",
    languagePreference: ["ko"],
  };

  const urgentJob = await prisma.job.create({
    data: { ...baseJob, title: "Urgent Daegu factory", category: "FACTORY", isUrgent: true, status: "OPEN" },
  });
  const normalJob = await prisma.job.create({
    data: { ...baseJob, title: "Normal Daegu factory", category: "FACTORY", isUrgent: false, status: "OPEN" },
  });

  const wSame = await makeWorker({ phone: TAG + "0001", district: "달서구", languages: ["ko"], urgentOnly: false, availability: ["NOW"] });
  const wOtherDistrict = await makeWorker({ phone: TAG + "0002", district: "북구", languages: ["ko"], urgentOnly: false });
  const wWrongLang = await makeWorker({ phone: TAG + "0003", district: "달서구", languages: ["en"], urgentOnly: false });
  const wUrgentOnly = await makeWorker({ phone: TAG + "0004", district: "달서구", languages: ["ko"], urgentOnly: true, availability: ["NOW"] });

  console.log("\nScenario A — urgent job in 달서구 (ko):");
  await notifyMatchingWorkers(urgentJob.id);
  assert((await countNotifs(wSame, urgentJob.id)) === 1, "worker in same district receives alert");
  assert((await countNotifs(wOtherDistrict, urgentJob.id)) === 0, "worker in different district does NOT receive alert");
  assert((await countNotifs(wWrongLang, urgentJob.id)) === 0, "worker with wrong language does NOT receive alert");
  assert((await countNotifs(wUrgentOnly, urgentJob.id)) === 1, "urgent-only worker receives urgent alert");

  console.log("\nScenario B — non-urgent job in 달서구 (ko):");
  await notifyMatchingWorkers(normalJob.id);
  assert((await countNotifs(wUrgentOnly, normalJob.id)) === 0, "urgent-only worker does NOT receive non-urgent alert");
  assert((await countNotifs(wSame, normalJob.id)) === 1, "regular worker receives non-urgent alert");

  console.log("\nScenario C — availability gating (matching engine):");
  const wUnavailable = await makeWorker({ phone: TAG + "0005", district: "달서구", languages: ["ko"], urgentOnly: false, availabilityStatus: "UNAVAILABLE" });
  const wTomorrow = await makeWorker({ phone: TAG + "0006", district: "달서구", languages: ["ko"], urgentOnly: false, availabilityStatus: "AVAILABLE_TOMORROW" });
  const urgentJob2 = await prisma.job.create({
    data: { ...baseJob, title: "Urgent #2", category: "FACTORY", isUrgent: true, status: "OPEN" },
  });
  const normalJob2 = await prisma.job.create({
    data: { ...baseJob, title: "Normal #2", category: "FACTORY", isUrgent: false, status: "OPEN" },
  });
  await notifyMatchingWorkers(urgentJob2.id);
  await notifyMatchingWorkers(normalJob2.id);
  assert((await countNotifs(wUnavailable, urgentJob2.id)) === 0, "UNAVAILABLE worker never receives urgent alert");
  assert((await countNotifs(wUnavailable, normalJob2.id)) === 0, "UNAVAILABLE worker never receives non-urgent alert");
  assert((await countNotifs(wTomorrow, urgentJob2.id)) === 0, "AVAILABLE_TOMORROW worker does NOT receive urgent alert");
  assert((await countNotifs(wTomorrow, normalJob2.id)) === 1, "AVAILABLE_TOMORROW worker receives non-urgent alert");

  await cleanup();

  console.log(failures === 0 ? "\n✅ All matching assertions passed." : `\n❌ ${failures} assertion(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await cleanup().catch(() => undefined);
  process.exit(1);
});
