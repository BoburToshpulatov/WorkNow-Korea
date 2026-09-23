"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

/** Founder tool: send a single test SMS and see the delivery status. */
export function TestSmsCard() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Test message");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "failed");
      toast(`SMS: ${data.status}${data.error ? ` (${data.error})` : ""}`, "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("admin.testSmsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="t-phone">{t("admin.testSmsPhone")}</Label>
          <Input id="t-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-msg">{t("admin.testSmsMessage")}</Label>
          <Input id="t-msg" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <Button size="sm" disabled={loading || !phone} onClick={send}>
          {loading ? t("common.saving") : t("admin.testSmsSend")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("notifications.smsConsentText")}</p>
      </CardContent>
    </Card>
  );
}
