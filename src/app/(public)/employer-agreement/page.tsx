import { LegalNotice } from "@/components/common/LegalNotice";
import { Disclaimer } from "@/components/common/Disclaimer";
import { getT } from "@/lib/getT";

export const metadata = { title: "Employer Agreement — WorkNow Korea" };

export default async function EmployerAgreementPage() {
  const { t } = await getT();
  return (
    <div className="container max-w-3xl py-12">
      <LegalNotice />
      <h1 className="text-3xl font-bold">{t("legal.employerAgrTitle")}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>{t("legal.employerAgrIntro")}</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>{t("legal.employerAgr1")}</li>
          <li>{t("legal.employerAgr2")}</li>
          <li>{t("legal.employerAgr3")}</li>
          <li>{t("legal.employerAgr4")}</li>
          <li>{t("legal.employerAgr5")}</li>
        </ul>
      </div>
      <Disclaimer className="mt-10" />
    </div>
  );
}
