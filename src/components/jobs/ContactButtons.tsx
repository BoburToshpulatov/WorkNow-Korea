"use client";

import { Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

/**
 * Secondary contact actions on the job detail page: copy number / copy
 * KakaoTalk ID. Calling lives in InterestButton so it always records interest.
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

  const copy = async (text: string, doneKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(t(doneKey), "success");
    } catch {
      toast(t("jobs.copyFailed"), "error");
    }
  };

  return (
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
  );
}
