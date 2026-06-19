"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { jobSchema, type JobInput } from "@/lib/validations";
import {
  JOB_CATEGORIES,
  LANGUAGES,
  PROVINCES,
  districtsForProvince,
  DURATION_TYPE_LABELS,
  SALARY_TYPE_LABELS,
  PAYMENT_TIMING_LABELS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";
import { Disclaimer } from "@/components/common/Disclaimer";

type JobFormValues = Partial<JobInput> & { id?: string };

function toDateTimeLocal(d?: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function JobForm({
  defaultValues,
  jobId,
}: {
  defaultValues?: JobFormValues;
  jobId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(jobSchema) as any,
    defaultValues: {
      title: defaultValues?.title ?? "",
      category: defaultValues?.category ?? "FACTORY",
      description: defaultValues?.description ?? "",
      address: defaultValues?.address ?? "",
      province: defaultValues?.province ?? "대구광역시",
      city: defaultValues?.city ?? "대구광역시",
      district: defaultValues?.district ?? "",
      region: defaultValues?.region ?? "",
      startDateTime: defaultValues?.startDateTime ?? new Date(),
      durationType: defaultValues?.durationType ?? "DAILY",
      durationDetails: defaultValues?.durationDetails ?? "",
      workersNeeded: defaultValues?.workersNeeded ?? 1,
      salaryAmount: defaultValues?.salaryAmount ?? 0,
      salaryType: defaultValues?.salaryType ?? "DAILY",
      paymentTiming: defaultValues?.paymentTiming ?? "SAME_DAY",
      requiredSkills: defaultValues?.requiredSkills ?? [],
      languagePreference: defaultValues?.languagePreference ?? [],
      visaNote: defaultValues?.visaNote ?? "",
      contactPhone: defaultValues?.contactPhone ?? "",
      kakaoId: defaultValues?.kakaoId ?? "",
      isUrgent: defaultValues?.isUrgent ?? false,
      safetyNotes: defaultValues?.safetyNotes ?? "",
    },
  });

  const onSubmit = async (values: JobInput) => {
    setSubmitting(true);
    try {
      const res = await fetch(jobId ? `/api/jobs/${jobId}` : "/api/jobs", {
        method: jobId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? t("jobForm.saveFailed"));
      }
      toast(
        jobId ? t("jobForm.updatedToast") : t("jobForm.createdToast"),
        "success"
      );
      router.push("/employer/jobs");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.somethingWrong"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Section title={t("jobForm.basics")}>
        <div className="space-y-1.5">
          <Label htmlFor="title">{t("jobForm.title")}</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder={t("jobForm.titlePlaceholder")}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{t("jobForm.category")}</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("jobForm.categoryPlaceholder")} />
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

        <div className="space-y-1.5">
          <Label htmlFor="description">{t("jobForm.description")}</Label>
          <Textarea
            id="description"
            rows={5}
            {...register("description")}
            placeholder={t("jobForm.descriptionPlaceholder")}
          />
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
      </Section>

      <Section title={t("jobForm.locationSection")}>
        <div className="space-y-1.5">
          <Label htmlFor="address">{t("jobForm.address")}</Label>
          <Input
            id="address"
            {...register("address")}
            placeholder={t("jobForm.addressPlaceholder")}
          />
          {errors.address && (
            <p className="text-xs text-destructive">{errors.address.message}</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    setValue("region", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("jobForm.provincePlaceholder")} />
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
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => {
                    field.onChange(v);
                    setValue("region", v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("jobForm.districtPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {districtsForProvince(watch("city")).map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.region && (
              <p className="text-xs text-destructive">
                {t("jobForm.districtRequired")}
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section title={t("jobForm.scheduleSection")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="startDateTime">{t("jobForm.startDateTime")}</Label>
            <Controller
              control={control}
              name="startDateTime"
              render={({ field }) => (
                <Input
                  id="startDateTime"
                  type="datetime-local"
                  value={toDateTimeLocal(field.value)}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workersNeeded">{t("jobForm.workersNeeded")}</Label>
            <Input
              id="workersNeeded"
              type="number"
              min={1}
              {...register("workersNeeded")}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("jobForm.durationType")}</Label>
            <Controller
              control={control}
              name="durationType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(DURATION_TYPE_LABELS).map((v) => (
                      <SelectItem key={v} value={v}>
                        {t(`enums.duration.${v}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="durationDetails">
              {t("jobForm.durationDetails")}
            </Label>
            <Input
              id="durationDetails"
              {...register("durationDetails")}
              placeholder={t("jobForm.durationPlaceholder")}
            />
            {errors.durationDetails && (
              <p className="text-xs text-destructive">
                {errors.durationDetails.message}
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section title={t("jobForm.paySection")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="salaryAmount">{t("jobForm.salaryAmount")}</Label>
            <Input
              id="salaryAmount"
              type="number"
              min={0}
              {...register("salaryAmount")}
            />
            {errors.salaryAmount && (
              <p className="text-xs text-destructive">
                {errors.salaryAmount.message}
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(SALARY_TYPE_LABELS).map((v) => (
                      <SelectItem key={v} value={v}>
                        {t(`enums.salaryType.${v}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("jobForm.paymentTiming")}</Label>
            <Controller
              control={control}
              name="paymentTiming"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(PAYMENT_TIMING_LABELS).map((v) => (
                      <SelectItem key={v} value={v}>
                        {t(`enums.paymentTiming.${v}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </Section>

      <Section title={t("jobForm.requirementsSection")}>
        <div className="space-y-1.5">
          <Label>{t("jobForm.languagePreference")}</Label>
          <Controller
            control={control}
            name="languagePreference"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => {
                  const selected = field.value?.includes(l.value);
                  return (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() =>
                        field.onChange(
                          selected
                            ? field.value.filter((v) => v !== l.value)
                            : [...(field.value ?? []), l.value]
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-sm ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      }`}
                    >
                      {t(`languages.${l.value}`)}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="visaNote">{t("jobForm.visaNote")}</Label>
          <Input
            id="visaNote"
            {...register("visaNote")}
            placeholder={t("jobForm.visaPlaceholder")}
          />
        </div>
      </Section>

      <Section title={t("jobForm.contactSection")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">{t("jobForm.contactPhone")}</Label>
            <Input
              id="contactPhone"
              {...register("contactPhone")}
              placeholder="010-1234-5678"
            />
            {errors.contactPhone && (
              <p className="text-xs text-destructive">
                {errors.contactPhone.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kakaoId">{t("jobForm.kakaoId")}</Label>
            <Input id="kakaoId" {...register("kakaoId")} />
          </div>
        </div>
      </Section>

      <Section title={t("jobForm.safetySection")}>
        <div className="space-y-1.5">
          <Label htmlFor="safetyNotes">{t("jobForm.safetyNotes")}</Label>
          <Textarea
            id="safetyNotes"
            rows={3}
            {...register("safetyNotes")}
            placeholder={t("jobForm.safetyPlaceholder")}
          />
        </div>
        <Controller
          control={control}
          name="isUrgent"
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-sm">{t("jobForm.markUrgent")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("jobForm.urgentHelp")}
                </p>
              </div>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      </Section>

      <Disclaimer />

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting
            ? t("common.saving")
            : jobId
              ? t("jobForm.update")
              : t("jobForm.submit")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
