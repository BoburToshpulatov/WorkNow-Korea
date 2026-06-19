import { getT } from "@/lib/getT";
import { LegalNotice } from "@/components/common/LegalNotice";
import { Disclaimer } from "@/components/common/Disclaimer";
import { HardHat, Briefcase, CheckCircle2 } from "lucide-react";

export const metadata = { title: "Safety — WorkNow Korea" };

export default async function SafetyPage() {
  const { t } = await getT();
  const workerItems = ["w1", "w2", "w3", "w4", "w5", "w6"];
  const employerItems = ["e1", "e2", "e3", "e4", "e5", "e6"];

  return (
    <div className="container max-w-3xl py-12">
      <LegalNotice />
      <h1 className="text-3xl font-bold">{t("footer.safety")}</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Worker checklist */}
        <section className="rounded-lg border p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <HardHat className="h-5 w-5 text-primary" />
            {t("safetyPage.workerTitle")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {workerItems.map((k) => (
              <li key={k} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{t(`safetyPage.${k}`)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Employer checklist */}
        <section className="rounded-lg border p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Briefcase className="h-5 w-5 text-secondary" />
            {t("safetyPage.employerTitle")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {employerItems.map((k) => (
              <li key={k} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{t(`safetyPage.${k}`)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Disclaimer className="mt-10" />
    </div>
  );
}
