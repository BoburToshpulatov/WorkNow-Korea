import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Clock,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { UrgentBadge } from "@/components/common/UrgentBadge";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { TrustBadge } from "@/components/common/TrustBadge";
import { Disclaimer } from "@/components/common/Disclaimer";
import { InterestButton } from "@/components/worker/InterestButton";
import { SaveJobButton } from "@/components/worker/SaveJobButton";
import { ReportButton } from "@/components/worker/ReportButton";
import { ContactButtons } from "@/components/jobs/ContactButtons";
import { getT } from "@/lib/getT";
import { formatJobSalary, formatDateTime, formatJobLocation } from "@/lib/i18n";
import { Analytics } from "@/lib/analytics";
import { getEmployerStats, employerTier } from "@/lib/trust";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { t, locale } = await getT();

  const job = await prisma.job.findUnique({
    where: { id },
    include: { employer: true },
  });
  // Workers may only view live jobs. PENDING (awaiting admin approval),
  // REJECTED, and CANCELLED jobs must not expose contact details.
  if (!job || (job.status !== "OPEN" && job.status !== "FILLED")) notFound();

  const [interest, saved] = await Promise.all([
    prisma.jobInterest.findUnique({
      where: { jobId_userId: { jobId: id, userId: session.user.id } },
    }),
    prisma.savedJob.findUnique({
      where: { jobId_userId: { jobId: id, userId: session.user.id } },
    }),
  ]);

  void Analytics.jobViewed(id, session.user.id);

  const empStats = await getEmployerStats(job.employerId);
  const employerTrust = employerTier(empStats);
  const locationText = formatJobLocation(job, locale);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/worker/jobs"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← {t("jobs.detailBackToList")}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CategoryIcon category={job.category} />
            <Badge variant="muted">{t(`enums.category.${job.category}`)}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold">{job.title}</h1>
        </div>
        {job.isUrgent && <UrgentBadge />}
      </div>

      {/* Big salary */}
      <Card className="mt-4">
        <CardContent className="p-5">
          <p className="text-3xl font-extrabold text-success">
            {formatJobSalary(job.salaryAmount, job.salaryType, locale)}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {t(`enums.paymentTiming.${job.paymentTiming}`)}
          </p>
        </CardContent>
      </Card>

      {/* Key facts */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Fact icon={MapPin} label={t("common.location")}>
          {job.address}
          {locationText ? ` · ${locationText}` : ""}
        </Fact>
        <Fact icon={Calendar} label={t("common.startTime")}>
          {formatDateTime(job.startDateTime, locale)}
        </Fact>
        <Fact icon={Clock} label={t("common.duration")}>
          {t(`enums.duration.${job.durationType}`)} · {job.durationDetails}
        </Fact>
        <Fact icon={Users} label={t("common.workersNeeded")}>
          {t("jobs.workersNeededShort", { count: job.workersNeeded })}
        </Fact>
      </div>

      {/* Map placeholder + distance (Phase 6) */}
      <div className="mt-4 flex h-40 flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-gray-50 text-sm text-muted-foreground">
        <span>{/* TODO: Kakao Maps / Naver Maps */}{t("jobs.mapPreview")}</span>
        <span className="flex items-center gap-1 text-xs">
          <Navigation className="h-3 w-3" /> {t("jobs.distanceSoon")}
        </span>
      </div>

      <Separator className="my-6" />

      <section>
        <h2 className="font-semibold">{t("jobs.description")}</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
          {job.description}
        </p>
      </section>

      {(job.requiredSkills.length > 0 || job.languagePreference.length > 0) && (
        <section className="mt-6">
          <h2 className="font-semibold">{t("jobs.requirements")}</h2>
          {job.languagePreference.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("jobs.requiredLanguage")}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {job.languagePreference.map((l) => (
              <Badge key={l} variant="secondary">
                {t(`languages.${l}`)}
              </Badge>
            ))}
            {job.requiredSkills.map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))}
          </div>
          {job.visaNote && (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("jobs.visaNote")}: {job.visaNote}
            </p>
          )}
        </section>
      )}

      {job.safetyNotes && (
        <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="flex items-center gap-2 font-semibold text-amber-900">
            <ShieldCheck className="h-4 w-4" /> {t("jobs.safetyNotes")}
          </h2>
          <p className="mt-1 text-sm text-amber-900">{job.safetyNotes}</p>
        </section>
      )}

      {/* Employer */}
      <section className="mt-6">
        <h2 className="font-semibold">{t("jobs.employerInfo")}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{job.employer.name}</span>
          <VerificationBadge status={job.employer.verificationStatus} />
          <TrustBadge tier={employerTrust} />
        </div>
        <p className="text-sm text-muted-foreground">
          {job.employer.businessType} · {job.employer.city}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("ts.jobsPosted")} {empStats.jobsPosted} · {t("ts.completedJobs")}{" "}
          {empStats.completedJobs} · {t("ts.joined")}{" "}
          {formatDateTime(empStats.joinedAt, locale)}
        </p>
      </section>

      {/* Foreign-worker safety reminder (Phase 4) */}
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {t("safety.workerNotice")}
      </div>

      <Disclaimer className="mt-4" />

      {/* Interest confirmation banner */}
      {interest && (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="font-semibold text-success">
              {t("jobs.interestConfirmTitle")}
            </p>
            <p className="text-muted-foreground">
              {t("jobs.interestConfirmBody")}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="sticky bottom-20 mt-6 space-y-3 md:bottom-6">
        <InterestButton jobId={job.id} initiallyInterested={!!interest} />
        <ContactButtons phone={job.contactPhone} kakaoId={job.kakaoId} />
        <SaveJobButton jobId={job.id} initiallySaved={!!saved} />
        <ReportButton jobId={job.id} />
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium">{children}</p>
    </div>
  );
}
