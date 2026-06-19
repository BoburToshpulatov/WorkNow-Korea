import { LegalNotice } from "@/components/common/LegalNotice";
import { Disclaimer } from "@/components/common/Disclaimer";

export const metadata = { title: "Worker Agreement — WorkNow Korea" };

export default function WorkerAgreementPage() {
  return (
    <div className="container max-w-3xl py-12">
      <LegalNotice />
      <h1 className="text-3xl font-bold">Worker Agreement</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          [Placeholder] By registering as a worker you acknowledge that WorkNow
          Korea is an information platform only and does not employ you.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>You contact and negotiate with employers directly.</li>
          <li>WorkNow Korea does not guarantee any job, salary, or hours.</li>
          <li>You are responsible for verifying job details and your eligibility to work.</li>
          <li>You will not pay any fee to obtain a job through the platform.</li>
          <li>You agree to use the platform honestly and report misconduct.</li>
        </ul>
      </div>
      <Disclaimer className="mt-10" />
    </div>
  );
}
