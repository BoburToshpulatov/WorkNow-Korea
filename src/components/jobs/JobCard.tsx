"use client";

import Link from "next/link";
import { MapPin, Clock, Users, Languages, Navigation, Train, ParkingCircle, Bus, Car } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { UrgentBadge } from "@/components/common/UrgentBadge";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { useT } from "@/components/LocaleProvider";
import { formatRelativeTime, cn } from "@/lib/utils";
import { formatJobSalary, formatJobLocation } from "@/lib/i18n";
import { formatDistance } from "@/lib/distance";
import type { JobWithEmployer } from "@/types";

export function JobCard({
  job,
  href,
  distanceKm,
}: {
  job: JobWithEmployer;
  href?: string;
  distanceKm?: number | null;
}) {
  const { t, locale } = useT();
  const link = href ?? `/worker/jobs/${job.id}`;
  const locationText = formatJobLocation(job, locale);

  return (
    <Link href={link}>
      <Card
        className={cn(
          "h-full p-4 transition-shadow hover:shadow-md active:scale-[0.99]",
          job.isUrgent && "border-2 border-urgent"
        )}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CategoryIcon category={job.category} />
            <Badge variant="muted">{t(`enums.category.${job.category}`)}</Badge>
          </div>
          <div className="flex flex-col items-end gap-1">
            {job.isUrgent && <UrgentBadge />}
            {job.urgencyType && (
              <Badge variant="outline" className="text-[10px] text-urgent">
                {t(`enums.urgencyType.${job.urgencyType}`)}
              </Badge>
            )}
          </div>
        </div>

        <h3 className="line-clamp-2 text-base font-semibold">{job.title}</h3>

        {/* Salary — the most prominent element on the card */}
        <p className="mt-2 text-2xl font-extrabold text-success">
          {formatJobSalary(job.salaryAmount, job.salaryType, locale)}
        </p>
        <p className="text-xs font-medium text-muted-foreground">
          {t(`enums.paymentTiming.${job.paymentTiming}`)}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {locationText}
          </span>
          {distanceKm != null && (
            <span className="flex items-center gap-1 font-medium text-primary">
              <Navigation className="h-3.5 w-3.5" />
              {formatDistance(distanceKm, locale)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {t("jobs.workersNeededShort", { count: job.workersNeeded })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeTime(job.createdAt, locale)}
          </span>
        </div>

        {job.languagePreference.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <Languages className="h-3.5 w-3.5 text-muted-foreground" />
            {job.languagePreference.map((l) => (
              <Badge key={l} variant="secondary" className="text-[11px]">
                {t(`languages.${l}`)}
              </Badge>
            ))}
          </div>
        )}

        {(job.nearPublicTransport ||
          job.shuttleProvided ||
          job.parkingAvailable ||
          job.pickupAvailable) && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {job.nearPublicTransport && (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Train className="h-3 w-3" /> {t("match.badgeMetro")}
              </Badge>
            )}
            {job.shuttleProvided && (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Bus className="h-3 w-3" /> {t("match.badgeShuttle")}
              </Badge>
            )}
            {job.parkingAvailable && (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <ParkingCircle className="h-3 w-3" /> {t("match.badgeParking")}
              </Badge>
            )}
            {job.pickupAvailable && (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Car className="h-3 w-3" /> {t("match.badgePickup")}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {job.employer?.name}
          </span>
          {job.employer?.verificationStatus === "VERIFIED" && (
            <VerificationBadge status="VERIFIED" />
          )}
        </div>
      </Card>
    </Link>
  );
}
