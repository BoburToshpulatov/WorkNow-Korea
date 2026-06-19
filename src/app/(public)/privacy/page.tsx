import { LegalNotice } from "@/components/common/LegalNotice";
import { Disclaimer } from "@/components/common/Disclaimer";

export const metadata = { title: "Privacy Policy — WorkNow Korea" };

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <LegalNotice />
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().getFullYear()}
      </p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          [Placeholder] This policy explains how WorkNow Korea collects, uses,
          and protects your personal information in accordance with Korea&apos;s
          Personal Information Protection Act (PIPA).
        </p>
        <h2 className="text-lg font-semibold text-foreground">Information we collect</h2>
        <p>[Placeholder] Phone number, optional email, profile details, and job activity.</p>
        <h2 className="text-lg font-semibold text-foreground">How we use it</h2>
        <p>[Placeholder] To operate the platform, match jobs, and send alerts you opt into.</p>
        <h2 className="text-lg font-semibold text-foreground">Sharing</h2>
        <p>
          [Placeholder] Contact details are shared between employers and
          interested workers to enable direct contact. We do not sell your data.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Your rights</h2>
        <p>[Placeholder] You may access, correct, or delete your data at any time.</p>
      </div>
      <Disclaimer className="mt-10" />
    </div>
  );
}
