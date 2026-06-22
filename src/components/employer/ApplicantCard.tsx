"use client";

import { Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { TrustBadge } from "@/components/common/TrustBadge";
import { ApplicantStatusControl } from "@/components/employer/ApplicantStatusControl";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useT } from "@/components/LocaleProvider";
import { formatRelativeTime } from "@/lib/utils";
import type { ApplicantWithProfile } from "@/types";
import type { TrustTier } from "@/lib/constants";

export function ApplicantCard({
  applicant,
  jobId,
  tier = "NEW",
  completedJobs = 0,
  noShowCount = 0,
  avgRating = null,
  reviewCount = 0,
  alreadyReviewed = false,
}: {
  applicant: ApplicantWithProfile;
  jobId: string;
  tier?: TrustTier;
  completedJobs?: number;
  noShowCount?: number;
  joinedAt?: Date;
  avgRating?: number | null;
  reviewCount?: number;
  alreadyReviewed?: boolean;
}) {
  const { t, locale } = useT();
  const profile = applicant.user.workerProfile;
  const name = profile?.name ?? t("enums.role.WORKER");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{name}</p>
                {profile && (
                  <VerificationBadge status={profile.verificationStatus} />
                )}
                <TrustBadge tier={tier} />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("employer.appliedAt")}{" "}
                {formatRelativeTime(applicant.createdAt, locale)} ·{" "}
                {t("ts.completedJobs")} {completedJobs} · {t("ts.noShows")}{" "}
                {noShowCount} ·{" "}
                {avgRating != null
                  ? `★ ${avgRating.toFixed(1)} (${reviewCount})`
                  : t("ts.noRating")}
              </p>
            </div>
          </div>
        </div>

        {applicant.message && (
          <p className="rounded-md bg-gray-50 p-3 text-sm">
            “{applicant.message}”
          </p>
        )}

        {profile && (
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant={
                profile.availabilityStatus === "UNAVAILABLE"
                  ? "outline"
                  : "secondary"
              }
              className={
                profile.availabilityStatus === "AVAILABLE_NOW"
                  ? "bg-success text-white"
                  : undefined
              }
            >
              {t(`enums.availabilityStatus.${profile.availabilityStatus}`)}
            </Badge>
            {profile.categories.map((c) => (
              <Badge key={c} variant="muted">
                {t(`enums.category.${c}`)}
              </Badge>
            ))}
            <Badge variant="outline">
              {t(`enums.transport.${profile.transport}`)}
            </Badge>
            {profile.languages.map((l) => (
              <Badge key={l} variant="secondary">
                {t(`languages.${l}`)}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t pt-3 text-sm">
          <span className="font-medium text-foreground">
            {applicant.user.phone}
          </span>
          <Button asChild size="sm" variant="secondary">
            <a href={`tel:${applicant.user.phone.replace(/[^0-9+]/g, "")}`}>
              <Phone className="h-3.5 w-3.5" /> {t("employer.callWorker")}
            </a>
          </Button>
        </div>

        <div className="border-t pt-3">
          <ApplicantStatusControl
            jobId={jobId}
            interestId={applicant.id}
            currentStatus={applicant.status}
          />
        </div>

        {applicant.status === "COMPLETED" && (
          <div className="border-t pt-3">
            <ReviewForm
              jobId={jobId}
              revieweeId={applicant.user.id}
              label={t("ts.reviewWorker")}
              alreadyReviewed={alreadyReviewed}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
