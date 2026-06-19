import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Pricing — WorkNow Korea" };

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    detail: "1 free job / month",
    features: ["1 active job", "Basic applicant list", "Standard placement"],
    highlight: false,
  },
  {
    name: "Small Business",
    price: "₩29,000",
    detail: "per month",
    features: ["10 active jobs", "Applicant messaging", "City-level alerts"],
    highlight: true,
  },
  {
    name: "Pro",
    price: "₩79,000",
    detail: "per month",
    features: ["40 active jobs", "Priority placement", "Verified badge"],
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "₩149,000",
    detail: "per month",
    features: ["Unlimited jobs", "Multiple locations", "Dedicated support"],
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="container max-w-6xl py-12">
      <div className="text-center">
        <Badge variant="success">Pilot — all plans free during launch</Badge>
        <h1 className="mt-4 text-3xl font-bold">Pricing</h1>
        <p className="mt-2 text-muted-foreground">
          Pay only for posting jobs. We never take a cut of worker wages.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlight ? "border-2 border-primary" : ""}
          >
            <CardHeader>
              {plan.highlight && (
                <Badge className="w-fit">Most popular</Badge>
              )}
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
                <Link href="/register/choose-role">Get started</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-lg border bg-gray-50 p-6 text-center">
        <h2 className="text-lg font-semibold">Urgent boost</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Push any job to the top with a red urgent badge and priority alerts —
          from ₩3,000 to ₩10,000 per boost depending on reach.
        </p>
      </div>
    </div>
  );
}
