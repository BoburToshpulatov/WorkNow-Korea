"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

/**
 * Leave a 1–5 star review after a COMPLETED job (Phase 5).
 * Collapses once submitted or if a review already exists.
 */
export function ReviewForm({
  jobId,
  revieweeId,
  label,
  alreadyReviewed = false,
}: {
  jobId: string;
  revieweeId: string;
  label: string;
  alreadyReviewed?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useT();
  const [done, setDone] = useState(alreadyReviewed);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (done) {
    return (
      <p className="text-xs text-muted-foreground">✓ {t("ts.reviewSubmitted")}</p>
    );
  }

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, revieweeId, rating, comment }),
      });
      if (res.status === 409) {
        setDone(true);
        toast(t("ts.reviewAlready"), "error");
        return;
      }
      if (res.status === 403) {
        toast(t("ts.reviewNotEligible"), "error");
        return;
      }
      if (!res.ok) throw new Error("failed");
      setDone(true);
      toast(t("ts.reviewSubmitted"), "success");
      router.refresh();
    } catch {
      toast(t("common.somethingWrong"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n}`}
          >
            <Star
              className={
                n <= rating
                  ? "h-5 w-5 fill-primary text-primary"
                  : "h-5 w-5 text-muted-foreground"
              }
            />
          </button>
        ))}
      </div>
      <Textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("ts.reviewComment")}
      />
      <Button size="sm" disabled={loading} onClick={submit}>
        {t("ts.reviewSubmit")}
      </Button>
    </div>
  );
}
