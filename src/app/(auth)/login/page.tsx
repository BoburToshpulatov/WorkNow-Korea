import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { getT } from "@/lib/getT";
import { safeNextPath } from "@/lib/utils";

export const metadata = { title: "로그인 — 워크나우 코리아" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { t } = await getT();
  const { next } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.welcomeBack")}</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm next={safeNextPath(next)} />
      </CardContent>
    </Card>
  );
}
