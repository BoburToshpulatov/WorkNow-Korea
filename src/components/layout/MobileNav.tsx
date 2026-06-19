"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Briefcase,
  Bookmark,
  Bell,
  User,
  PlusCircle,
  ListChecks,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/LocaleProvider";
import { useUnreadCount } from "@/components/notifications/useUnreadCount";

interface NavItem {
  href: string;
  key: string;
  icon: LucideIcon;
  badge?: boolean; // show unread notification count
}

const WORKER_NAV: NavItem[] = [
  { href: "/worker/dashboard", key: "nav.home", icon: Home },
  { href: "/worker/jobs", key: "nav.jobs", icon: Briefcase },
  { href: "/worker/saved", key: "nav.saved", icon: Bookmark },
  { href: "/worker/notifications", key: "nav.alerts", icon: Bell, badge: true },
  { href: "/worker/profile", key: "nav.profile", icon: User },
];

const EMPLOYER_NAV: NavItem[] = [
  { href: "/employer/dashboard", key: "nav.home", icon: Home, badge: true },
  { href: "/employer/jobs/quick-new", key: "nav.register", icon: PlusCircle },
  { href: "/employer/jobs", key: "nav.myJobs", icon: ListChecks },
  { href: "/employer/profile", key: "nav.profile", icon: User },
];

export function MobileNav({ role }: { role: "WORKER" | "EMPLOYER" }) {
  const pathname = usePathname();
  const { t } = useT();
  const unread = useUnreadCount();
  const items = role === "EMPLOYER" ? EMPLOYER_NAV : WORKER_NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white md:hidden">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item, i) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${i}`}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 text-[11px]",
                active ? "text-primary" : "text-gray-500"
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && unread > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgent px-1 text-[9px] font-bold text-urgent-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              {t(item.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
