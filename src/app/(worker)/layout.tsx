import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "WORKER") redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex flex-1 gap-6">
        <Sidebar role="WORKER" />
        <main className="flex-1 py-6 pb-24 md:pb-6">{children}</main>
      </div>
      <MobileNav role="WORKER" />
    </div>
  );
}
