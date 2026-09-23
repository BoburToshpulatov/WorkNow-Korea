import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getLocale, getT } from "@/lib/getT";
import { env, isProduction } from "@/lib/env";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "WorkNow Korea — Find Workers. Find Work.",
  description:
    "WorkNow Korea is a job information platform connecting employers and workers directly for on-demand and short-term labor across Korea.",
  // Keep staging/dev out of search results.
  robots: isProduction ? undefined : { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const { t } = await getT();
  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {env.appEnv === "staging" && (
          <div className="bg-amber-400 px-4 py-1 text-center text-xs font-semibold text-amber-950">
            {t("common.stagingBanner")}
          </div>
        )}
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
