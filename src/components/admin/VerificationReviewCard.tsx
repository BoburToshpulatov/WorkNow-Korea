"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VerificationBadge } from "@/components/common/VerificationBadge";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

interface Field {
  label: string;
  value: string;
}

/**
 * Admin verification review (Phase 1/2): shows submitted info and lets the
 * admin approve / reject / request more info with an internal note.
 */
export function VerificationReviewCard({
  target,
  profileId,
  name,
  status,
  fields,
}: {
  target: "WORKER" | "EMPLOYER";
  profileId: string;
  name: string;
  status: string;
  fields: Field[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const act = async (next: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, profileId, status: next, note }),
      });
      if (!res.ok) throw new Error("failed");
      toast(t("admin.verifyChanged", { status: t(`verification.${next}`) }), "success");
      router.refresh();
    } catch {
      toast(t("admin.verifyFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{name}</p>
          <VerificationBadge status={status} />
        </div>
        <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label} className="flex gap-2">
              <dt className="text-muted-foreground">{f.label}:</dt>
              <dd className="font-medium">{f.value || "—"}</dd>
            </div>
          ))}
        </dl>
        <Textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("ts.notePlaceholder")}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="success" disabled={loading} onClick={() => act("VERIFIED")}>
            {t("ts.approve")}
          </Button>
          <Button size="sm" variant="destructive" disabled={loading} onClick={() => act("REJECTED")}>
            {t("ts.reject")}
          </Button>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => act("NEEDS_MORE_INFO")}>
            {t("ts.needsInfo")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
