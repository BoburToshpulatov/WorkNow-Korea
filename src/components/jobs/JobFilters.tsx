"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { JOB_CATEGORIES, KOREAN_CITIES, LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useT } from "@/components/LocaleProvider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const QUICK_CHIPS = [
  { key: "all", labelKey: "jobs.filterAll" },
  { key: "urgent", labelKey: "jobs.filterUrgent" },
  { key: "sameDayPay", labelKey: "jobs.filterSameDay" },
  { key: "night", labelKey: "jobs.filterNight" },
];

export function JobFilters({ hasLocation = false }: { hasLocation?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { t } = useT();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "" || value === "all") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  const activeChip = params.get("quick") ?? "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setParam("quick", chip.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              activeChip === chip.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent"
            )}
          >
            {t(chip.labelKey)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Select
          value={params.get("category") ?? "all"}
          onValueChange={(v) => setParam("category", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("jobs.categoryPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("jobs.allCategories")}</SelectItem>
            {JOB_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.icon} {t(`enums.category.${c.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get("city") ?? "all"}
          onValueChange={(v) => setParam("city", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("jobs.cityPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("jobs.allCities")}</SelectItem>
            {KOREAN_CITIES.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get("salaryType") ?? "all"}
          onValueChange={(v) => setParam("salaryType", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("jobs.salaryTypePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("jobs.allSalary")}</SelectItem>
            <SelectItem value="HOURLY">{t("enums.salaryType.HOURLY")}</SelectItem>
            <SelectItem value="DAILY">{t("enums.salaryType.DAILY")}</SelectItem>
            <SelectItem value="MONTHLY">{t("enums.salaryType.MONTHLY")}</SelectItem>
            <SelectItem value="FIXED">{t("enums.salaryType.FIXED")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.get("language") ?? "all"}
          onValueChange={(v) => setParam("language", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("jobs.languagePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("jobs.anyLanguage")}</SelectItem>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {t(`languages.${l.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort + distance + payment timing (matching engine) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select
          value={params.get("sort") ?? "urgent"}
          onValueChange={(v) => setParam("sort", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("match.sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgent">{t("match.sortUrgent")}</SelectItem>
            <SelectItem value="nearest" disabled={!hasLocation}>
              {t("match.sortNearest")}
            </SelectItem>
            <SelectItem value="highestPay">{t("match.sortHighestPay")}</SelectItem>
            <SelectItem value="newest">{t("match.sortNewest")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.get("within") ?? "all"}
          onValueChange={(v) => setParam("within", v)}
          disabled={!hasLocation}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("match.distanceWithin")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("match.anyDistance")}</SelectItem>
            {[5, 10, 20, 50].map((km) => (
              <SelectItem key={km} value={String(km)}>
                {t("match.within", { km })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get("paymentTiming") ?? "all"}
          onValueChange={(v) => setParam("paymentTiming", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("enums.paymentTiming.SAME_DAY")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("jobs.allSalary")}</SelectItem>
            <SelectItem value="SAME_DAY">{t("enums.paymentTiming.SAME_DAY")}</SelectItem>
            <SelectItem value="AFTER_COMPLETION">{t("enums.paymentTiming.AFTER_COMPLETION")}</SelectItem>
            <SelectItem value="WEEKLY">{t("enums.paymentTiming.WEEKLY")}</SelectItem>
            <SelectItem value="MONTHLY">{t("enums.paymentTiming.MONTHLY")}</SelectItem>
            <SelectItem value="NEGOTIABLE">{t("enums.paymentTiming.NEGOTIABLE")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!hasLocation && (
        <p className="text-xs text-muted-foreground">{t("match.locationNeeded")}</p>
      )}
    </div>
  );
}
