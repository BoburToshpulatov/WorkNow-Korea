"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useT } from "@/components/LocaleProvider";

const NAV_LINKS = [
  { href: "/worker/jobs", key: "nav.findWork" },
  { href: "/employer/jobs/new", key: "nav.postJob" },
  { href: "/how-it-works", key: "nav.howItWorks" },
  { href: "/pricing", key: "nav.pricing" },
];

export function Header() {
  const { data: session } = useSession();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const role = session?.user?.role;

  const dashboardHref =
    role === "EMPLOYER"
      ? "/employer/dashboard"
      : role === "ADMIN"
        ? "/admin/dashboard"
        : "/worker/dashboard";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          <span className="text-primary">WorkNow</span>{" "}
          <span className="text-gray-700">Korea</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-600 hover:text-primary"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          {session?.user && <NotificationBell />}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar>
                    <AvatarFallback>
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{session.user.phone}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref}>{t("nav.dashboard")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild>
                <Link href="/register/choose-role">{t("nav.signup")}</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-white md:hidden">
          <nav className="container flex flex-col gap-1 py-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
              >
                {t(l.key)}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <LanguageSwitcher className="w-full justify-center" />
              {session?.user ? (
                <>
                  <Button asChild variant="outline">
                    <Link href={dashboardHref}>{t("nav.dashboard")}</Link>
                  </Button>
                  <Button onClick={() => signOut({ callbackUrl: "/" })}>
                    {t("nav.logout")}
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link href="/login">{t("nav.login")}</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register/choose-role">{t("nav.signup")}</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
