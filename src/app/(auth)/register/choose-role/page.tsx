import Link from "next/link";
import { getT } from "@/lib/getT";
import { Briefcase, HardHat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "회원가입 — 워크나우 코리아" };

export default async function ChooseRolePage() {
  const { t } = await getT();
  return (
    <div className="space-y-4">
      <h1 className="text-center text-2xl font-bold">{t("auth.joinTitle")}</h1>
      <p className="text-center text-sm text-muted-foreground">
        {t("auth.chooseHow")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/register?role=EMPLOYER">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <Briefcase className="h-10 w-10 text-primary" />
              <h2 className="text-lg font-semibold">{t("auth.iAmEmployer")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("auth.iAmEmployerDesc")}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/register?role=WORKER">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <HardHat className="h-10 w-10 text-secondary" />
              <h2 className="text-lg font-semibold">{t("auth.iAmWorker")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("auth.iAmWorkerDesc")}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
