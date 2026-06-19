import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Role-aware entry point. After login (or any "go to my dashboard" link) users
 * land here and are routed to the correct home for their role.
 */
export default async function DashboardRouter() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin/dashboard");
    case "EMPLOYER":
      redirect("/employer/dashboard");
    case "WORKER":
    default:
      redirect("/worker/dashboard");
  }
}
