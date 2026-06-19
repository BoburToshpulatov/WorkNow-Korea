"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/LocaleProvider";
import type { JobStatus as JobStatusEnum } from "@prisma/client";

const VARIANT: Record<
  JobStatusEnum,
  "default" | "secondary" | "success" | "urgent" | "muted"
> = {
  PENDING: "secondary",
  OPEN: "success",
  FILLED: "muted",
  CANCELLED: "muted",
  REJECTED: "urgent",
};

export function JobStatus({ status }: { status: JobStatusEnum }) {
  const { t } = useT();
  return (
    <Badge variant={VARIANT[status]}>{t(`enums.jobStatus.${status}`)}</Badge>
  );
}
