import { LegalNotice } from "@/components/common/LegalNotice";
import { Disclaimer } from "@/components/common/Disclaimer";

export const metadata = { title: "Terms of Service — WorkNow Korea" };

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12">
      <LegalNotice />
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().getFullYear()}
      </p>
      <div className="prose mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          [Placeholder] These Terms govern your use of WorkNow Korea (the
          &quot;Platform&quot;). By using the Platform you agree to these Terms.
        </p>
        <h2 className="text-lg font-semibold text-foreground">1. Nature of the service</h2>
        <p>
          WorkNow Korea is a job information platform only. We do not employ,
          dispatch, or supervise workers and are not a party to any agreement
          between employers and workers. We make no guarantee of hiring, salary,
          working conditions, or employment.
        </p>
        <h2 className="text-lg font-semibold text-foreground">2. User responsibilities</h2>
        <p>
          [Placeholder] Users must provide accurate information, comply with all
          applicable Korean laws, and verify details directly with the other
          party.
        </p>
        <h2 className="text-lg font-semibold text-foreground">3. Prohibited conduct</h2>
        <p>[Placeholder] Fraud, fee-charging to workers, and harassment are prohibited.</p>
        <h2 className="text-lg font-semibold text-foreground">4. Limitation of liability</h2>
        <p>[Placeholder] The Platform is provided &quot;as is&quot; without warranties.</p>
      </div>
      <Disclaimer className="mt-10" />
    </div>
  );
}
