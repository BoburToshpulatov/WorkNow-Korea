import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getT } from "@/lib/getT";

export const metadata = { title: "회원가입 — 워크나우 코리아" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const selectedRole = role === "EMPLOYER" ? "EMPLOYER" : "WORKER";
  const { t } = await getT();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {selectedRole === "EMPLOYER" ? t("auth.employerSignup") : t("auth.workerSignup")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RegisterForm role={selectedRole} />
      </CardContent>
    </Card>
  );
}
