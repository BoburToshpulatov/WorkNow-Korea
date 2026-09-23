"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, History } from "lucide-react";
import { quickJobSchema, type QuickJobInput } from "@/lib/validations";
import {
  JOB_CATEGORIES,
  MINIMUM_WAGE,
  PROVINCES,
  districtsForProvince,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

function toDateTimeLocal(d: Date) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

/** Start of the next full hour — a realistic default for "need people now". */
function nextFullHour() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

const WAGE_VARS = {
  year: MINIMUM_WAGE.year,
  hourly: MINIMUM_WAGE.hourly.toLocaleString("ko-KR"),
};

export interface QuickJobDefaults {
  category: QuickJobInput["category"];
  city: string;
  district: string | null;
  salaryAmount: number;
  salaryType: QuickJobInput["salaryType"];
  workersNeeded: number;
  contactPhone: string;
}

export function QuickJobForm({
  defaultPhone,
  defaultCity,
  defaultDistrict = "",
  lastJob,
  autoPublish = false,
}: {
  defaultPhone: string;
  defaultCity: string;
  defaultDistrict?: string;
  lastJob?: QuickJobDefaults | null;
  autoPublish?: boolean;
}) {
  const { toast } = useToast();
  const { t } = useT();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; live: boolean } | null>(null);

  const initialCity =
    [lastJob?.city, defaultCity].find(
      (c): c is string => !!c && PROVINCES.includes(c),
    ) ?? "대구광역시";
  const initialDistrict =
    lastJob?.city === initialCity
      ? (lastJob.district ?? "")
      : initialCity === defaultCity
        ? defaultDistrict
        : "";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuickJobInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(quickJobSchema) as any,
    defaultValues: {
      category: lastJob?.category ?? "FACTORY",
      province: initialCity,
      city: initialCity,
      district: initialDistrict,
      startDateTime: nextFullHour(),
      // Empty (not 0) so the employer must enter pay; 0 fails validation.
      salaryAmount: lastJob?.salaryAmount ?? ("" as unknown as number),
      salaryType: lastJob?.salaryType ?? "DAILY",
      workersNeeded: lastJob?.workersNeeded ?? 1,
      contactPhone: lastJob?.contactPhone || defaultPhone,
      isUrgent: false,
    },
  });

  const onSubmit = async (values: QuickJobInput) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.error === "START_IN_PAST"
            ? t("jobForm.startInPast")
            : t("jobForm.saveFailed"),
        );
      }
      const data = await res.json();
      setDone({ id: data.job.id, live: data.job.status === "OPEN" });
    } catch (e) {
      toast(
        e instanceof Error ? e.message : t("common.somethingWrong"),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (done) {
    return (
      <div className="mx-auto max-w-md text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h2 className="mt-4 text-xl font-bold">
          {done.live
            ? t("employer.quickPostLiveTitle")
            : t("employer.quickPostSuccessTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {done.live
            ? t("employer.quickPostLiveBody")
            : t("employer.quickPostSuccessBody")}
        </p>
        {!done.live && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("employer.quickPostReviewNote")}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild size="lg">
            <Link href={`/employer/jobs/${done.id}/edit`}>
              {t("employer.quickPostAddDetails")}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/employer/jobs">{t("employer.quickPostViewJobs")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-md space-y-4"
    >
      {lastJob && (
        <p className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          <History className="h-4 w-4 shrink-0" />
          {t("employer.quickPostPrefilled")}
        </p>
      )}
      <div className="space-y-1.5">
        <Label>{t("jobForm.category")}</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.icon} {t(`enums.category.${c.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("jobForm.province")}</Label>
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  setValue("province", v);
                  setValue("district", "");
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("jobForm.district")}</Label>
          <Controller
            control={control}
            name="district"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t("jobForm.districtPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {districtsForProvince(watch("city")).map((dd) => (
                    <SelectItem key={dd} value={dd}>
                      {dd}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.district && (
            <p className="text-xs text-destructive">
              {errors.district.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="startDateTime">{t("jobForm.startDateTime")}</Label>
        <Controller
          control={control}
          name="startDateTime"
          render={({ field }) => (
            <Input
              id="startDateTime"
              type="datetime-local"
              className="h-12"
              value={toDateTimeLocal(
                field.value instanceof Date
                  ? field.value
                  : new Date(field.value),
              )}
              onChange={(e) => field.onChange(new Date(e.target.value))}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="salaryAmount">{t("jobForm.salaryAmount")}</Label>
          <Input
            id="salaryAmount"
            type="number"
            inputMode="numeric"
            className="h-12"
            {...register("salaryAmount")}
          />
          {errors.salaryAmount?.message && (
            <p className="text-xs text-destructive">
              {t(errors.salaryAmount.message, WAGE_VARS)}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>{t("jobForm.salaryType")}</Label>
          <Controller
            control={control}
            name="salaryType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["HOURLY", "DAILY", "MONTHLY", "FIXED"] as const).map(
                    (v) => (
                      <SelectItem key={v} value={v}>
                        {t(`enums.salaryType.${v}`)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">
        {t("jobForm.minimumWageHint", WAGE_VARS)}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="workersNeeded">{t("jobForm.workersNeeded")}</Label>
          <Input
            id="workersNeeded"
            type="number"
            inputMode="numeric"
            min={1}
            className="h-12"
            {...register("workersNeeded")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPhone">{t("jobForm.contactPhone")}</Label>
          <Input
            id="contactPhone"
            inputMode="tel"
            className="h-12"
            placeholder="010-1234-5678"
            {...register("contactPhone")}
          />
          {errors.contactPhone && (
            <p className="text-xs text-destructive">
              {errors.contactPhone.message}
            </p>
          )}
        </div>
      </div>

      <Controller
        control={control}
        name="isUrgent"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label className="text-sm">{t("jobForm.markUrgent")}</Label>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full text-base"
        disabled={submitting}
      >
        {submitting ? t("common.saving") : t("employer.quickPostCta")}
      </Button>
      {!autoPublish && (
        <p className="text-center text-xs text-muted-foreground">
          {t("employer.quickPostReviewNote")}
        </p>
      )}
    </form>
  );
}
