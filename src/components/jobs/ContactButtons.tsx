"use client";

import { Phone, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

/**
 * Contact actions on the job detail page (Phase 4).
 * Call / copy number / copy KakaoTalk ID — the core employer↔worker handoff.
 */
export function ContactButtons({
  phone,
  kakaoId,
}: {
  phone: string;
  kakaoId?: string | null;
}) {
  const { toast } = useToast();
  const { t } = useT();
  const telHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;

  const copy = async (text: string, doneKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(t(doneKey), "success");
    } catch {
      toast(t("jobs.copyFailed"), "error");
    }
  };

  return (
    <div className="space-y-3">
      <Button asChild size="lg" className="h-14 w-full text-base">
        <a href={telHref}>
          <Phone className="h-5 w-5" /> {t("common.call")}
        </a>
      </Button>
      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          variant="outline"
          className="h-12"
          onClick={() => copy(phone, "jobs.copiedPhone")}
        >
          <Copy className="h-4 w-4" /> {t("common.copyNumber")}
        </Button>
        {kakaoId ? (
          <Button
            size="lg"
            variant="outline"
            className="h-12"
            onClick={() => copy(kakaoId, "jobs.copiedKakao")}
          >
            <MessageCircle className="h-4 w-4" /> {t("jobs.copyKakaoShort")}
          </Button>
        ) : (
          <Button size="lg" variant="outline" className="h-12" disabled>
            <MessageCircle className="h-4 w-4" /> {t("jobs.kakaoNotSet")}
          </Button>
        )}
      </div>
    </div>
  );
}
