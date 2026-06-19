import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex flex-1 gap-6">
        <Sidebar role="ADMIN" />
        <main className="flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
