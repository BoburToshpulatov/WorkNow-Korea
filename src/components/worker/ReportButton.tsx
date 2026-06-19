"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

// Report reason codes (Phase 4). Labels resolve via reportReason.* catalog.
const REASON_CODES = [
  "FAKE_JOB",
  "UNPAID_WAGE",
  "UNSAFE_WORK",
  "WRONG_SALARY",
  "HARASSMENT",
  "SCAM_SPAM",
  "NO_SHOW",
  "OTHER",
];

export function ReportButton({ jobId }: { jobId: string }) {
  const { toast } = useToast();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState(REASON_CODES[0]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      // Send the code (for filtering) + the label (for display).
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          reasonCode,
          reason: t(`reportReason.${reasonCode}`),
          details,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast(t("report.thanks"), "success");
      setOpen(false);
      setDetails("");
    } catch {
      toast(t("report.failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-destructive"
      >
        <Flag className="h-3 w-3" /> {t("report.trigger")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("report.title")}</DialogTitle>
            <DialogDescription>{t("report.desc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="report-reason">{t("report.reason")}</Label>
              <select
                id="report-reason"
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {REASON_CODES.map((c) => (
                  <option key={c} value={c}>
                    {t(`reportReason.${c}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-details">{t("report.details")}</Label>
              <Textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("report.detailsPlaceholder")}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? t("report.submitting") : t("report.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
