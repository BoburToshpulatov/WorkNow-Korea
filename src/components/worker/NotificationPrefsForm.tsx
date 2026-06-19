"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  notificationPrefSchema,
  type NotificationPrefInput,
} from "@/lib/validations";
import { KOREAN_CITIES, JOB_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

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

export function NotificationPrefsForm({
  defaultValues,
}: {
  defaultValues?: Partial<NotificationPrefInput>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const { handleSubmit, control, register } = useForm<NotificationPrefInput>({
    resolver: zodResolver(notificationPrefSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      cities: defaultValues?.cities ?? [],
      radius: defaultValues?.radius ?? 10,
      categories: defaultValues?.categories ?? [],
      urgentOnly: defaultValues?.urgentOnly ?? false,
      enabled: defaultValues?.enabled ?? true,
      inAppEnabled: defaultValues?.inAppEnabled ?? true,
      emailEnabled: defaultValues?.emailEnabled ?? true,
      smsEnabled: defaultValues?.smsEnabled ?? false,
      pushEnabled: defaultValues?.pushEnabled ?? false,
      nightJobsAllowed: defaultValues?.nightJobsAllowed ?? true,
      quietHoursStart: defaultValues?.quietHoursStart ?? null,
      quietHoursEnd: defaultValues?.quietHoursEnd ?? null,
    },
  });

  const onSubmit = async (values: NotificationPrefInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/worker/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(t("notifications.saveFailed"));
      toast(t("notifications.saved"), "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.somethingWrong"), "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (
    name:
      | "emailEnabled"
      | "smsEnabled"
      | "pushEnabled"
      | "enabled"
      | "inAppEnabled"
      | "nightJobsAllowed",
    label: string,
    note: string
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="text-sm">{label}</Label>
            <p className="text-xs text-muted-foreground">{note}</p>
          </div>
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label>{t("notifications.citiesToWatch")}</Label>
        <Controller
          control={control}
          name="cities"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {KOREAN_CITIES.slice(0, 12).map((c) => (
                <Chip
                  key={c}
                  selected={field.value?.includes(c)}
                  onClick={() =>
                    field.onChange(
                      field.value?.includes(c)
                        ? field.value.filter((v) => v !== c)
                        : [...(field.value ?? []), c]
                    )
                  }
                >
                  {c}
                </Chip>
              ))}
            </div>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="radius">{t("notifications.radius")}</Label>
        <Input id="radius" type="number" min={1} {...register("radius")} />
      </div>

      <div className="space-y-2">
        <Label>{t("notifications.categories")}</Label>
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

      <Controller
        control={control}
        name="urgentOnly"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">{t("notifications.urgentOnly")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("notifications.urgentOnly")}
              </p>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />

      {toggleRow("enabled", t("notifications.masterEnabled"), "")}
      {toggleRow("inAppEnabled", t("notifications.inAppAlerts"), t("notifications.emailAlertsDesc"))}
      {toggleRow("smsEnabled", t("notifications.smsAlerts"), t("notifications.smsConsentText"))}
      {toggleRow("nightJobsAllowed", t("notifications.nightJobs"), "")}

      {/* Quiet hours */}
      <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
        <div className="col-span-2 text-sm font-medium">{t("notifications.quietHours")}</div>
        <div className="space-y-1">
          <Label htmlFor="qstart" className="text-xs">{t("notifications.quietFrom")}</Label>
          <Input id="qstart" type="number" min={0} max={23} {...register("quietHoursStart")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="qend" className="text-xs">{t("notifications.quietTo")}</Label>
          <Input id="qend" type="number" min={0} max={23} {...register("quietHoursEnd")} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("notifications.smsOptOut")}</p>

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? t("common.saving") : t("notifications.save")}
      </Button>
    </form>
  );
}
