import { Search, UserCheck, Bell } from "lucide-react";
import { Disclaimer } from "@/components/common/Disclaimer";
import { getT } from "@/lib/getT";

export const metadata = { title: "How It Works — WorkNow Korea" };

export default async function HowItWorksPage() {
  const { t } = await getT();
  const sections = [
    {
      icon: Search,
      title: t("pub.howWorkersTitle"),
      points: [
        t("pub.howWorkers1"),
        t("pub.howWorkers2"),
        t("pub.howWorkers3"),
        t("pub.howWorkers4"),
      ],
    },
    {
      icon: UserCheck,
      title: t("pub.howEmployersTitle"),
      points: [
        t("pub.howEmployers1"),
        t("pub.howEmployers2"),
        t("pub.howEmployers3"),
        t("pub.howEmployers4"),
      ],
    },
    {
      icon: Bell,
      title: t("pub.howSafeTitle"),
      points: [t("pub.howSafe1"), t("pub.howSafe2"), t("pub.howSafe3")],
    },
  ];

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">{t("pub.howTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("pub.howIntro")}</p>

      <div className="mt-10 space-y-8">
        {sections.map((sec) => (
          <section key={sec.title} className="rounded-lg border p-6">
            <div className="flex items-center gap-3">
              <sec.icon className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">{sec.title}</h2>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-muted-foreground">
              {sec.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Disclaimer className="mt-10" />
    </div>
  );
}
