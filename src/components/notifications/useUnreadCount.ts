"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Fetches the current user's unread notification count for nav badges.
 * Polls lightly (every 60s) so badges stay roughly fresh without websockets.
 */
export function useUnreadCount() {
  const { status } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (active) setUnread(data.unread ?? 0);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [status]);

  return unread;
}
