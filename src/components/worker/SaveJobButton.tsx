"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

export function SaveJobButton({
  jobId,
  initiallySaved = false,
}: {
  jobId: string;
  initiallySaved?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/save`, {
        method: saved ? "DELETE" : "POST",
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      setSaved(!saved);
      toast(saved ? t("jobs.unsavedToast") : t("jobs.savedToast"), "success");
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
      variant="outline"
      className="w-full"
    >
      <Bookmark className={saved ? "fill-foreground" : ""} />
      {saved ? t("jobs.saved") : t("jobs.saveAction")}
    </Button>
  );
}
