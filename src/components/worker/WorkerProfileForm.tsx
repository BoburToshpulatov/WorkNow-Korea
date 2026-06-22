"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  workerProfileSchema,
  type WorkerProfileInput,
} from "@/lib/validations";
import {
  PROVINCES,
  districtsForProvince,
  LANGUAGES,
  JOB_CATEGORIES,
  AVAILABILITY_LABELS,
  TRANSPORT_LABELS,
  VISA_CATEGORIES,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { DocumentUpload } from "@/components/verification/DocumentUpload";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input"
      }`}
    >
      {children}
    </button>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

export function WorkerProfileForm({
  defaultValues,
  verificationStatus = "UNVERIFIED",
  verificationNote,
}: {
  defaultValues?: Partial<WorkerProfileInput>;
  verificationStatus?: string;
  verificationNote?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerProfileInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(workerProfileSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? "",
      preferredCity: defaultValues?.preferredCity ?? "대구광역시",
      preferredProvince: defaultValues?.preferredProvince ?? "대구광역시",
      preferredDistrict: defaultValues?.preferredDistrict ?? "",
      preferredRadius: defaultValues?.preferredRadius ?? 10,
      currentLatitude: defaultValues?.currentLatitude ?? null,
      currentLongitude: defaultValues?.currentLongitude ?? null,
      availabilityStatus: defaultValues?.availabilityStatus ?? "AVAILABLE_TODAY",
      languages: defaultValues?.languages ?? [],
      categories: defaultValues?.categories ?? [],
      availability: defaultValues?.availability ?? [],
      transport: defaultValues?.transport ?? "PUBLIC_TRANSIT",
      experience: defaultValues?.experience ?? "",
      visaNote: defaultValues?.visaNote ?? "",
      nationality: defaultValues?.nationality ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      visaCategory: (defaultValues?.visaCategory ?? "") as any,
      bio: defaultValues?.bio ?? "",
    },
  });

  const onSubmit = async (values: WorkerProfileInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/worker/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(t("worker.profileSaveFailed"));
      toast(t("worker.profileSaved"), "success");
      router.push("/worker/dashboard");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.somethingWrong"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("worker.name")}</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>{t("worker.preferredArea")}</Label>
          <Controller
            control={control}
            name="preferredCity"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  setValue("preferredProvince", v);
                  setValue("preferredDistrict", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("worker.preferredDistrict")}</Label>
          <Controller
            control={control}
            name="preferredDistrict"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {districtsForProvince(watch("preferredCity")).map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preferredRadius">{t("worker.travelRadius")}</Label>
          <Input
            id="preferredRadius"
            type="number"
            min={1}
            {...register("preferredRadius")}
          />
        </div>
      </div>
      <Hint>{t("worker.guidanceDistricts")}</Hint>

      {/* Current location for distance-based matching (optional) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="currentLatitude">{t("worker.currentLatitude")}</Label>
          <Input
            id="currentLatitude"
            type="number"
            step="any"
            placeholder="35.8714"
            {...register("currentLatitude")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currentLongitude">{t("worker.currentLongitude")}</Label>
          <Input
            id="currentLongitude"
            type="number"
            step="any"
            placeholder="128.6014"
            {...register("currentLongitude")}
          />
        </div>
      </div>
      <Hint>{t("worker.locationHint")}</Hint>

      <div className="space-y-2">
        <Label>{t("common.languages")}</Label>
        <Controller
          control={control}
          name="languages"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <Chip
                  key={l.value}
                  selected={field.value?.includes(l.value)}
                  onClick={() =>
                    field.onChange(
                      field.value?.includes(l.value)
                        ? field.value.filter((v) => v !== l.value)
                        : [...(field.value ?? []), l.value]
                    )
                  }
                >
                  {t(`languages.${l.value}`)}
                </Chip>
              ))}
            </div>
          )}
        />
        <Hint>{t("worker.guidanceLanguages")}</Hint>
      </div>

      <div className="space-y-2">
        <Label>{t("worker.jobCategories")}</Label>
        <Controller
          control={control}
          name="categories"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {JOB_CATEGORIES.map((c) => (
                <Chip
                  key={c.value}
                  selected={field.value?.includes(c.value)}
                  onClick={() =>
                    field.onChange(
                      field.value?.includes(c.value)
                        ? field.value.filter((v) => v !== c.value)
                        : [...(field.value ?? []), c.value]
                    )
                  }
                >
                  {c.icon} {t(`enums.category.${c.value}`)}
                </Chip>
              ))}
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("worker.availability")}</Label>
        <Controller
          control={control}
          name="availability"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {Object.keys(AVAILABILITY_LABELS).map((value) => (
                <Chip
                  key={value}
                  selected={field.value?.includes(value as never)}
                  onClick={() =>
                    field.onChange(
                      field.value?.includes(value as never)
                        ? field.value.filter((v) => v !== value)
                        : [...(field.value ?? []), value]
                    )
                  }
                >
                  {t(`enums.availability.${value}`)}
                </Chip>
              ))}
            </div>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("worker.transport")}</Label>
        <Controller
          control={control}
          name="transport"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(TRANSPORT_LABELS).map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(`enums.transport.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="experience">{t("worker.experience")}</Label>
        <Textarea id="experience" rows={3} {...register("experience")} />
      </div>

      {/* Verification: nationality + eligibility (Phase 2) */}
      <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("ts.workerVerifyTitle")}</span>
          <VerificationBadge status={verificationStatus} />
        </div>
        <p className="text-xs text-muted-foreground">{t("ts.workerVerifyWhy")}</p>
        {verificationNote && (
          <p className="text-xs text-amber-700">
            {t("ts.adminNote")}: {verificationNote}
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nationality">{t("ts.nationality")}</Label>
            <Input id="nationality" {...register("nationality")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("ts.visaCategory")}</Label>
            <Controller
              control={control}
              name="visaCategory"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISA_CATEGORIES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {t(`visa.${v}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          {t("ts.eligibilityDisclaimer")}
        </div>
        <DocumentUpload documentTypes={["ID_CARD", "VISA_DOCUMENT", "OTHER"]} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="visaNote">{t("jobs.visaNote")}</Label>
        <Input id="visaNote" {...register("visaNote")} />
        <Hint>{t("worker.guidanceVisa")}</Hint>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">{t("worker.bio")}</Label>
        <Textarea id="bio" rows={3} {...register("bio")} />
      </div>

      {/* Foreign-worker safety reminder (Phase 4) */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        {t("worker.guidancePay")} {t("safety.workerNotice")}
      </div>

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? t("common.saving") : t("nav.profile")}
      </Button>
    </form>
  );
}
