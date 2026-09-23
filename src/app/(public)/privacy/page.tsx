import { LegalNotice } from "@/components/common/LegalNotice";
import { Disclaimer } from "@/components/common/Disclaimer";
import { getT } from "@/lib/getT";

export const metadata = { title: "Privacy Policy — WorkNow Korea" };

export default async function PrivacyPage() {
  const { t } = await getT();
  return (
    <div className="container max-w-3xl py-12">
      <LegalNotice />
      <h1 className="text-3xl font-bold">{t("legal.privacyTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("legal.lastUpdated", { year: new Date().getFullYear() })}
      </p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>{t("legal.privacyIntro")}</p>
        <h2 className="text-lg font-semibold text-foreground">{t("legal.privacy1Title")}</h2>
        <p>{t("legal.privacy1Body")}</p>
        <h2 className="text-lg font-semibold text-foreground">{t("legal.privacy2Title")}</h2>
        <p>{t("legal.privacy2Body")}</p>
        <h2 className="text-lg font-semibold text-foreground">{t("legal.privacy3Title")}</h2>
        <p>{t("legal.privacy3Body")}</p>
        <h2 className="text-lg font-semibold text-foreground">{t("legal.privacy4Title")}</h2>
        <p>{t("legal.privacy4Body")}</p>
      </div>
      <Disclaimer className="mt-10" />
    </div>
  );
}
