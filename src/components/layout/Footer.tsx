"use client";

import Link from "next/link";
import { useT } from "@/components/LocaleProvider";

const LEGAL_LINKS = [
  { href: "/how-it-works", key: "footer.howItWorks" },
  { href: "/safety", key: "footer.safety" },
  { href: "/pricing", key: "footer.pricing" },
  { href: "/terms", key: "footer.terms" },
  { href: "/privacy", key: "footer.privacy" },
  { href: "/worker-agreement", key: "footer.workerAgreement" },
  { href: "/employer-agreement", key: "footer.employerAgreement" },
];

export function Footer() {
  const { t } = useT();
  return (
    <footer className="border-t bg-gray-50">
      <div className="container py-10">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="text-lg font-extrabold">
              <span className="text-primary">WorkNow</span>{" "}
              <span className="text-gray-700">Korea</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-600 hover:text-primary"
              >
                {t(l.key)}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
          {t("legal.disclaimer")}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} WorkNow Korea. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
