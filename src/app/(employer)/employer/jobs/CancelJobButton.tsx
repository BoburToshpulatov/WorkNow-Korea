"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

export function CancelJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [loading, setLoading] = useState(false);

  const cancel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast(t("employer.jobCancelled"), "success");
      router.refresh();
    } catch {
      toast(t("employer.jobCancelFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={cancel}
      disabled={loading}
    >
      <XCircle className="h-4 w-4" /> {t("employer.cancelJob")}
    </Button>
  );
}
