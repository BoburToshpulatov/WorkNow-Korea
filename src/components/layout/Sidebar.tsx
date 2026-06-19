"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Briefcase,
  Bookmark,
  Bell,
  User,
  PlusCircle,
  ListChecks,
  Users,
  BarChart3,
  Flag,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/LocaleProvider";

interface NavItem {
  href: string;
  key: string;
  icon: LucideIcon;
}

const NAV: Record<string, NavItem[]> = {
  WORKER: [
    { href: "/worker/dashboard", key: "nav.dashboard", icon: Home },
    { href: "/worker/jobs", key: "nav.findWork", icon: Briefcase },
    { href: "/worker/saved", key: "worker.savedTitle", icon: Bookmark },
    { href: "/worker/applications", key: "ts.myAppsTitle", icon: ListChecks },
    { href: "/worker/notifications", key: "notifications.title", icon: Bell },
    { href: "/worker/profile", key: "nav.profile", icon: User },
  ],
  EMPLOYER: [
    { href: "/employer/dashboard", key: "nav.dashboard", icon: Home },
    { href: "/employer/jobs/new", key: "nav.postJob", icon: PlusCircle },
    { href: "/employer/jobs", key: "nav.myJobs", icon: ListChecks },
    { href: "/employer/profile", key: "employer.profileTitle", icon: User },
  ],
  ADMIN: [
    { href: "/admin/founder", key: "admin.founder", icon: BarChart3 },
    { href: "/admin/dashboard", key: "admin.overviewTitle", icon: BarChart3 },
    { href: "/admin/users", key: "nav.users", icon: Users },
    { href: "/admin/jobs", key: "admin.jobsTitle", icon: ShieldCheck },
    { href: "/admin/verifications", key: "ts.verifQueueTitle", icon: ShieldCheck },
    { href: "/admin/documents", key: "admin.docReviewQueue", icon: ShieldCheck },
    { href: "/admin/reports", key: "nav.reports", icon: Flag },
    { href: "/admin/notifications", key: "admin.notifTitle", icon: Bell },
    { href: "/admin/analytics", key: "admin.analytics", icon: BarChart3 },
    { href: "/admin/ops", key: "admin.ops", icon: BarChart3 },
  ],
};

export function Sidebar({ role }: { role: "WORKER" | "EMPLOYER" | "ADMIN" }) {
  const pathname = usePathname();
  const { t } = useT();
  const items = NAV[role] ?? [];

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-gray-50 md:block">
      <nav className="sticky top-16 flex flex-col gap-1 p-4">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
