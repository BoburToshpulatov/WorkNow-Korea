import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/getT";

export const metadata = { title: "Pricing — WorkNow Korea" };

export default async function PricingPage() {
  const { t } = await getT();
  const plans = [
    {
      name: t("pub.planStarter"),
      price: t("pub.priceFree"),
      detail: t("pub.starterDetail"),
      features: [t("pub.fStarter1"), t("pub.fStarter2"), t("pub.fStarter3")],
      highlight: false,
    },
    {
      name: t("pub.planSmall"),
      price: "₩29,000",
      detail: t("pub.perMonthDetail"),
      features: [t("pub.fSmall1"), t("pub.fSmall2"), t("pub.fSmall3")],
      highlight: true,
    },
    {
      name: t("pub.planPro"),
      price: "₩79,000",
      detail: t("pub.perMonthDetail"),
      features: [t("pub.fPro1"), t("pub.fPro2"), t("pub.fPro3")],
      highlight: false,
    },
    {
      name: t("pub.planEnterprise"),
      price: "₩149,000",
      detail: t("pub.perMonthDetail"),
      features: [t("pub.fEnt1"), t("pub.fEnt2"), t("pub.fEnt3")],
      highlight: false,
    },
  ];

  return (
    <div className="container max-w-6xl py-12">
      <div className="text-center">
        <Badge variant="success">{t("pub.pricingBadge")}</Badge>
        <h1 className="mt-4 text-3xl font-bold">{t("pub.pricingTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("pub.pricingIntro")}</p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlight ? "border-2 border-primary" : ""}
          >
            <CardHeader>
              {plan.highlight && <Badge className="w-fit">{t("pub.mostPopular")}</Badge>}
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-3xl font-extrabold">
                {plan.price}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {plan.detail}
                </span>
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full" variant={plan.highlight ? "default" : "outline"}>
                <Link href="/register/choose-role">{t("pub.getStarted")}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-lg border bg-gray-50 p-6 text-center">
        <h2 className="text-lg font-semibold">{t("pub.boostTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("pub.boostDesc")}</p>
      </div>
    </div>
  );
}
