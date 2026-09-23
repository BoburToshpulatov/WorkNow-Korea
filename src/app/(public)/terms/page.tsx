import { LegalNotice } from "@/components/common/LegalNotice";
import { Disclaimer } from "@/components/common/Disclaimer";
import { getT } from "@/lib/getT";

export const metadata = { title: "Terms of Service — WorkNow Korea" };

export default async function TermsPage() {
  const { t } = await getT();
  return (
    <div className="container max-w-3xl py-12">
      <LegalNotice />
      <h1 className="text-3xl font-bold">{t("legal.termsTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("legal.lastUpdated", { year: new Date().getFullYear() })}
      </p>
      <div className="prose mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>{t("legal.termsIntro")}</p>
        <h2 className="text-lg font-semibold text-foreground">{t("legal.terms1Title")}</h2>
        <p>{t("legal.terms1Body")}</p>
        <h2 className="text-lg font-semibold text-foreground">{t("legal.terms2Title")}</h2>
        <p>{t("legal.terms2Body")}</p>
        <h2 className="text-lg font-semibold text-foreground">{t("legal.terms3Title")}</h2>
        <p>{t("legal.terms3Body")}</p>
        <h2 className="text-lg font-semibold text-foreground">{t("legal.terms4Title")}</h2>
        <p>{t("legal.terms4Body")}</p>
      </div>
      <Disclaimer className="mt-10" />
    </div>
  );
}
