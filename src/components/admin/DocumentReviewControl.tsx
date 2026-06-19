"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

/** Admin approves/rejects an uploaded verification document. */
export function DocumentReviewControl({ docId }: { docId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verification-documents/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
      toast(t("admin.docDeleted"), "success");
      router.refresh();
    } catch {
      toast(t("admin.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const act = async (status: "APPROVED" | "REJECTED") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verification-documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note }),
      });
      if (!res.ok) throw new Error("failed");
      toast(t("admin.statusChanged"), "success");
      router.refresh();
    } catch {
      toast(t("admin.actionFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("ts.notePlaceholder")}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="success" disabled={loading} onClick={() => act("APPROVED")}>
          {t("ts.approve")}
        </Button>
        <Button size="sm" variant="destructive" disabled={loading} onClick={() => act("REJECTED")}>
          {t("ts.reject")}
        </Button>
        <Button size="sm" variant="outline" disabled={loading} onClick={remove}>
          {t("admin.deleteDoc")}
        </Button>
      </div>
    </div>
  );
}
