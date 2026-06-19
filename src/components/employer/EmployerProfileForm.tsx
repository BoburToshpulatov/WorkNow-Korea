"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  employerProfileSchema,
  type EmployerProfileInput,
} from "@/lib/validations";
import { PROVINCES, districtsForProvince } from "@/lib/constants";
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

export function EmployerProfileForm({
  defaultValues,
  verificationStatus = "UNVERIFIED",
  verificationNote,
}: {
  defaultValues?: Partial<EmployerProfileInput>;
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
  } = useForm<EmployerProfileInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(employerProfileSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? "",
      businessType: defaultValues?.businessType ?? "",
      city: defaultValues?.city ?? "대구광역시",
      province: defaultValues?.province ?? "대구광역시",
      district: defaultValues?.district ?? "",
      representativeName: defaultValues?.representativeName ?? "",
      businessAddress: defaultValues?.businessAddress ?? "",
      businessRegistrationNumber:
        defaultValues?.businessRegistrationNumber ?? "",
      bio: defaultValues?.bio ?? "",
    },
  });

  const onSubmit = async (values: EmployerProfileInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/employer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(t("worker.profileSaveFailed"));
      toast(t("employer.profileSaved"), "success");
      router.push("/employer/dashboard");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.somethingWrong"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Verification status + why it matters (Phase 1) */}
      <div className="rounded-lg border bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("ts.empVerifyStatus")}</span>
          <VerificationBadge status={verificationStatus} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("ts.empVerifyWhy")}
        </p>
        {verificationNote && (
          <p className="mt-2 text-xs text-amber-700">
            {t("ts.adminNote")}: {verificationNote}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">{t("employer.bizName")}</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="repName">{t("ts.repName")}</Label>
        <Input id="repName" {...register("representativeName")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bizAddress">{t("ts.bizAddress")}</Label>
        <Input id="bizAddress" {...register("businessAddress")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="businessType">{t("employer.bizType")}</Label>
        <Input
          id="businessType"
          {...register("businessType")}
          placeholder={t("employer.bizTypePlaceholder")}
        />
        {errors.businessType && (
          <p className="text-xs text-destructive">
            {errors.businessType.message}
          </p>
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
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
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
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="brn">{t("employer.brn")}</Label>
        <Input
          id="brn"
          {...register("businessRegistrationNumber")}
          placeholder="000-00-00000"
        />
        <p className="text-xs text-muted-foreground">
          {t("employer.brnHelp")}
        </p>
        {errors.businessRegistrationNumber && (
          <p className="text-xs text-destructive">
            {errors.businessRegistrationNumber.message}
          </p>
        )}
      </div>

      <DocumentUpload documentTypes={["BUSINESS_REGISTRATION", "OTHER"]} />

      <div className="space-y-1.5">
        <Label htmlFor="bio">{t("employer.bizIntro")}</Label>
        <Textarea id="bio" rows={4} {...register("bio")} />
      </div>
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? t("common.saving") : t("ts.submitForReview")}
      </Button>
    </form>
  );
}
