"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

export function InterestButton({
  jobId,
  initiallyInterested = false,
}: {
  jobId: string;
  initiallyInterested?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [interested, setInterested] = useState(initiallyInterested);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/interest`, {
        method: interested ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
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
    <Button
      onClick={toggle}
      disabled={loading}
      size="lg"
      variant={interested ? "outline" : "default"}
      className="h-14 w-full text-base"
    >
      <Heart className={interested ? "fill-primary text-primary" : ""} />
      {interested ? t("jobs.interestedDone") : t("jobs.interested")}
    </Button>
  );
}
