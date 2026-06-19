"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

export function RerunNotificationsButton() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ops/rerun-notifications", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      toast(`${t("admin.rerunDone")} (${data.retried ?? 0})`, "success");
      router.refresh();
    } catch {
      toast(t("admin.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={run}>
      <RefreshCw className="h-4 w-4" /> {t("admin.rerunFailed")}
    </Button>
  );
}
