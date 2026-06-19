"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Check,
  Briefcase,
  UserPlus,
  RefreshCw,
  ShieldCheck,
  Info,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useT } from "@/components/LocaleProvider";
import { formatRelativeTime } from "@/lib/utils";

type NotifType =
  | "NEW_MATCHING_JOB"
  | "NEW_INTEREST"
  | "STATUS_CHANGE"
  | "VERIFICATION_UPDATE"
  | "SYSTEM";

interface NotificationItem {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  jobId: string | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<NotifType, LucideIcon> = {
  NEW_MATCHING_JOB: Briefcase,
  NEW_INTEREST: UserPlus,
  STATUS_CHANGE: RefreshCw,
  VERIFICATION_UPDATE: ShieldCheck,
  SYSTEM: Info,
};

// Where a notification leads when clicked (type-aware).
function hrefFor(n: NotificationItem): string | null {
  if (!n.jobId) return null;
  if (n.type === "NEW_INTEREST") return `/employer/jobs/${n.jobId}/applicants`;
  return `/worker/jobs/${n.jobId}`; // job alert / status update
}

/**
 * In-app notification inbox (Phase 1 polish). Reads /api/notifications, shows
 * type icons, type-aware clickable cards, mark-read / mark-all-read, and
 * loading / empty / error states. Works in Korean and English via t().
 */
export function NotificationInbox() {
  const { t, locale } = useT();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : {}),
      });
      load();
    } catch {
      setError(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="h-5 w-5" />
          {t("notifications.inboxTitle")}
          {unread > 0 && <Badge variant="urgent">{unread}</Badge>}
        </h2>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markRead()}>
            <Check className="h-4 w-4" /> {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-between p-4 text-sm">
            <span className="text-muted-foreground">
              {t("common.somethingWrong")}
            </span>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title={t("notifications.inboxEmpty")}
          description={t("notifications.inboxEmptyDesc")}
        />
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Info;
            const href = hrefFor(n);
            const inner = (
              <Card
                className={
                  n.readAt ? "opacity-70" : "border-primary/40 bg-orange-50/50"
                }
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRelativeTime(n.createdAt, locale)}
                    </p>
                  </div>
                  {!n.readAt && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        markRead(n.id);
                      }}
                      className="shrink-0 text-xs text-primary hover:underline"
                    >
                      {t("notifications.markRead")}
                    </button>
                  )}
                </CardContent>
              </Card>
            );
            return href ? (
              <a key={n.id} href={href}>
                {inner}
              </a>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
