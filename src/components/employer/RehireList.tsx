"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { Users } from "lucide-react";
import { useT } from "@/components/LocaleProvider";

export interface RehireWorker {
  userId: string;
  name: string;
  completedTogether: number;
  lastWorked: string | null; // ISO
  avgRating: number | null;
  reviewCount: number;
}

export interface OpenJobOption {
  id: string;
  title: string;
}

export function RehireList({
  workers,
  openJobs,
}: {
  workers: RehireWorker[];
  openJobs: OpenJobOption[];
}) {
  const { t, locale } = useT();
  const [jobId, setJobId] = useState<string>(openJobs[0]?.id ?? "");
  const [sent, setSent] = useState<Record<string, "ok" | "err" | "loading">>({});

  async function invite(workerUserId: string) {
    if (!jobId) return;
    setSent((s) => ({ ...s, [workerUserId]: "loading" }));
    try {
      const res = await fetch("/api/employer/rehire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerUserId, jobId }),
      });
      if (!res.ok) throw new Error();
      setSent((s) => ({ ...s, [workerUserId]: "ok" }));
    } catch {
      setSent((s) => ({ ...s, [workerUserId]: "err" }));
    }
  }

  if (workers.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-10 w-10" />}
        title={t("match.rehireTitle")}
        description={t("match.rehireNoWorkers")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {openJobs.length === 0 ? (
        <p className="text-sm text-urgent">{t("match.rehireNoOpenJob")}</p>
      ) : (
        <div className="max-w-md">
          <label className="mb-1 block text-sm font-medium">
            {t("match.rehireSelectJob")}
          </label>
          <Select value={jobId} onValueChange={setJobId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {openJobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {workers.map((w) => {
          const state = sent[w.userId];
          return (
            <Card key={w.userId}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {w.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{w.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("match.completedTogether")}: {w.completedTogether} ·{" "}
                      {w.avgRating != null
                        ? `★ ${w.avgRating.toFixed(1)} (${w.reviewCount})`
                        : "—"}
                    </p>
                    {w.lastWorked && (
                      <p className="text-xs text-muted-foreground">
                        {t("match.lastWorked")}:{" "}
                        {new Intl.DateTimeFormat(
                          locale === "ko" ? "ko-KR" : "en-US",
                          { dateStyle: "medium" }
                        ).format(new Date(w.lastWorked))}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t pt-3">
                  {state === "ok" ? (
                    <Badge className="bg-success text-white">
                      {t("match.rehireSent")}
                    </Badge>
                  ) : state === "err" ? (
                    <span className="text-xs text-urgent">
                      {t("match.rehireError")}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("match.completedTogether")}: {w.completedTogether}
                    </span>
                  )}
                  <Button
                    size="sm"
                    disabled={!jobId || state === "loading" || state === "ok"}
                    onClick={() => invite(w.userId)}
                  >
                    {t("match.rehireSend")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
