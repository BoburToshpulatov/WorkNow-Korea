"use client";

import { useState } from "react";
import { Heart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

/**
 * Primary job action. Calling always records interest first, so every
 * contact shows up in the employer's applicant list (hire tracking, rehire,
 * reliability) — the worker just taps once and the dialer opens.
 * "Interest only" is for workers who'd rather the employer call them.
 */
export function InterestButton({
  jobId,
  phone,
  initiallyInterested = false,
}: {
  jobId: string;
  phone: string;
  initiallyInterested?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [interested, setInterested] = useState(initiallyInterested);
  const [loading, setLoading] = useState(false);
  const telHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;

  const send = (method: "POST" | "DELETE", source?: "call" | "interest") =>
    fetch(`/api/jobs/${jobId}/interest`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(source ? { source } : {}),
      // Survives the page handing off to the phone dialer.
      keepalive: true,
    });

  // Don't block the tel: navigation — record interest in the background.
  const onCall = () => {
    if (interested) return;
    setInterested(true);
    send("POST", "call")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        router.refresh();
      })
      .catch(() => setInterested(false));
  };

  const toggleInterest = async () => {
    setLoading(true);
    try {
      const res = await send(interested ? "DELETE" : "POST", "interest");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      setInterested(!interested);
      toast(
        interested ? t("jobs.interestRemoved") : t("jobs.interestToast"),
        "success"
      );
      router.refresh();
    } catch {
      toast(t("common.somethingWrong"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl bg-background/95 p-2 shadow-lg ring-1 ring-border backdrop-blur">
      <Button asChild size="lg" className="h-14 w-full text-base">
        <a href={telHref} onClick={onCall}>
          <Phone className="h-5 w-5" />
          {interested ? t("common.call") : t("jobs.interestAndCall")}
        </a>
      </Button>
      <Button
        onClick={toggleInterest}
        disabled={loading}
        variant="ghost"
        className="h-10 w-full text-sm"
      >
        <Heart className={interested ? "fill-primary text-primary" : ""} />
        {interested ? t("jobs.withdrawInterest") : t("jobs.interestOnly")}
      </Button>
    </div>
  );
}
