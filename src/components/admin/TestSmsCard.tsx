"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

/** Founder tool: send a single test SMS and see the delivery status. */
export function TestSmsCard() {
  const router = useRouter();
  const { toast } = useToast();
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
        <CardTitle className="text-lg">Test SMS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="t-phone">Phone</Label>
          <Input id="t-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="t-msg">Message</Label>
          <Input id="t-msg" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <Button size="sm" disabled={loading || !phone} onClick={send}>
          {loading ? "Sending…" : "Send test SMS"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Sends to one number. Mock mode logs a MOCKED delivery; no secrets are stored.
        </p>
      </CardContent>
    </Card>
  );
}
