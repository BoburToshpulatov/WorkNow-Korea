import { LegalNotice } from "@/components/common/LegalNotice";
import { Disclaimer } from "@/components/common/Disclaimer";
import { getT } from "@/lib/getT";

export const metadata = { title: "Worker Agreement — WorkNow Korea" };

export default async function WorkerAgreementPage() {
  const { t } = await getT();
  return (
    <div className="container max-w-3xl py-12">
      <LegalNotice />
      <h1 className="text-3xl font-bold">{t("legal.workerAgrTitle")}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>{t("legal.workerAgrIntro")}</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>{t("legal.workerAgr1")}</li>
          <li>{t("legal.workerAgr2")}</li>
          <li>{t("legal.workerAgr3")}</li>
          <li>{t("legal.workerAgr4")}</li>
          <li>{t("legal.workerAgr5")}</li>
        </ul>
      </div>
      <Disclaimer className="mt-10" />
    </div>
  );
}
