import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { getT } from "@/lib/getT";

export const metadata = { title: "로그인 — 워크나우 코리아" };

export default async function LoginPage() {
  const { t } = await getT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.welcomeBack")}</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
