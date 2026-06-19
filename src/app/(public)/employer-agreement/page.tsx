import { LegalNotice } from "@/components/common/LegalNotice";
import { Disclaimer } from "@/components/common/Disclaimer";

export const metadata = { title: "Employer Agreement — WorkNow Korea" };

export default function EmployerAgreementPage() {
  return (
    <div className="container max-w-3xl py-12">
      <LegalNotice />
      <h1 className="text-3xl font-bold">Employer Agreement</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          [Placeholder] By posting jobs you acknowledge that WorkNow Korea is an
          information platform only and does not dispatch or supervise workers.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>You are the employer and are responsible for the employment relationship.</li>
          <li>You will comply with all Korean labor, safety, and immigration laws.</li>
          <li>You will post accurate pay, payment timing, and safety information.</li>
          <li>You will pay workers directly and on the stated schedule.</li>
          <li>You will not discriminate unlawfully or post fraudulent listings.</li>
        </ul>
      </div>
      <Disclaimer className="mt-10" />
    </div>
  );
}
