import Link from "next/link";
import {
  Search,
  UserCheck,
  Bell,
  ShieldCheck,
  Zap,
  HandCoins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JOB_CATEGORIES } from "@/lib/constants";
import { Disclaimer } from "@/components/common/Disclaimer";
import { getT } from "@/lib/getT";

export default async function LandingPage() {
  const { t } = await getT();
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-orange-50 to-white">
        <div className="container py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t("landing.heroTitlePre")} <span className="text-primary">{t("landing.heroTitleEm")}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t("landing.heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/employer/jobs/new">{t("nav.postJob")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/worker/jobs">{t("nav.findWork")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h2 className="text-2xl font-bold">{t("landing.problemTitle")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("landing.problemDesc")}
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <Zap className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{t("landing.slowTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("landing.slowDesc")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <HandCoins className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{t("landing.feeTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("landing.feeDesc")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Solution / 3 steps */}
      <section className="bg-gray-50">
        <div className="container py-16">
          <h2 className="text-center text-2xl font-bold">{t("landing.howTitle")}</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: t("landing.step1Title"),
                text: t("landing.step1Desc"),
              },
              {
                icon: UserCheck,
                title: t("landing.step2Title"),
                text: t("landing.step2Desc"),
              },
              {
                icon: Bell,
                title: t("landing.step3Title"),
                text: t("landing.step3Desc"),
              },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <h2 className="text-center text-2xl font-bold">{t("landing.categoriesTitle")}</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {JOB_CATEGORIES.slice(0, 7).map((c) => (
            <Link key={c.value} href={`/worker/jobs?category=${c.value}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                  <span className="text-3xl">{c.icon}</span>
                  <span className="text-sm font-medium">{t(`enums.category.${c.value}`)}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-primary-foreground">
        <div className="container grid gap-8 py-14 text-center sm:grid-cols-3">
          {[
            { value: "1,200+", label: t("landing.statsJobs") },
            { value: "3,500+", label: t("landing.statsWorkers") },
            { value: "3", label: t("landing.statsCities") },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-sm opacity-90">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing summary */}
      <section className="container py-16 text-center">
        <h2 className="text-2xl font-bold">{t("landing.pricingTitle")}</h2>
        <p className="mt-2 text-muted-foreground">
          {t("landing.pricingDesc")}
        </p>
        <Button className="mt-6" variant="outline" asChild>
          <Link href="/pricing">{t("landing.seePlans")}</Link>
        </Button>
      </section>

      {/* Safety / legal */}
      <section className="bg-gray-50">
        <div className="container py-16">
          <div className="mx-auto max-w-3xl text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-success" />
            <h2 className="mt-4 text-2xl font-bold">{t("landing.safetyTitle")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("landing.safetyDesc")}
            </p>
          </div>
          <Disclaimer className="mx-auto mt-8 max-w-3xl" />
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-20 text-center">
        <h2 className="text-3xl font-bold">{t("landing.readyTitle")}</h2>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/employer/jobs/new">{t("nav.postJob")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/worker/jobs">{t("nav.findWork")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
