"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Upload, FileText, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/components/LocaleProvider";

interface DocMeta {
  id: string;
  documentType: string;
  originalFilename: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
}

const STATUS_VARIANT: Record<string, "success" | "muted" | "urgent"> = {
  APPROVED: "success",
  PENDING: "muted",
  REJECTED: "urgent",
};

/**
 * Verification document upload + list (Phases 1–4). Used in both profile forms.
 * Files are private; only admins can open them.
 */
export function DocumentUpload({
  documentTypes,
}: {
  documentTypes: string[];
}) {
  const { t } = useT();
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [docType, setDocType] = useState(documentTypes[0]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/verification/documents");
      if (res.ok) setDocs((await res.json()).documents ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onPick = async (file: File) => {
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast(t("ts.docTypeError"), "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast(t("ts.docSizeError"), "error");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", docType);
      const res = await fetch("/api/verification/documents/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("failed");
      toast(t("ts.docUploaded"), "success");
      if (inputRef.current) inputRef.current.value = "";
      load();
    } catch {
      toast(t("common.somethingWrong"), "error");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/verification/documents/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast(t("ts.docDeleted"), "success");
      load();
    } else {
      toast(t("common.somethingWrong"), "error");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <FileText className="h-4 w-4" /> {t("ts.docTitle")}
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{t("ts.docPrivacy")}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-2 text-sm"
        >
          {documentTypes.map((d) => (
            <option key={d} value={d}>
              {t(`ts.docType${d}`)}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? t("ts.docUploading") : t("ts.docUpload")}
        </Button>
      </div>

      {docs.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("ts.docNone")}</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate">
                  {t(`ts.docType${d.documentType}`)} ·{" "}
                  <span className="text-muted-foreground">{d.originalFilename}</span>
                </p>
                {d.adminNote && (
                  <p className="text-xs text-amber-700">{d.adminNote}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={STATUS_VARIANT[d.status]}>
                  {t(`ts.docStatus${d.status}`)}
                </Badge>
                {d.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => remove(d.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={t("ts.docDelete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
