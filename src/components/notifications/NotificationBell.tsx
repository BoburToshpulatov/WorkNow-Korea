"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { useUnreadCount } from "@/components/notifications/useUnreadCount";

/**
 * Header bell with an unread badge. Links to the role's notification surface:
 * worker → alerts page, employer → dashboard inbox, admin → notification logs.
 */
export function NotificationBell() {
  const { data: session } = useSession();
  const unread = useUnreadCount();
  if (!session?.user) return null;

  const role = session.user.role;
  const href =
    role === "EMPLOYER"
      ? "/employer/dashboard"
      : role === "ADMIN"
        ? "/admin/notifications"
        : "/worker/notifications";

  return (
    <Link
      href={href}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5 text-gray-600" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-urgent px-1 text-[10px] font-bold text-urgent-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
