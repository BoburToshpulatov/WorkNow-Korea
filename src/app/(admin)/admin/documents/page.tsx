import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/i18n";
import { DocumentReviewControl } from "@/components/admin/DocumentReviewControl";

export default async function AdminDocumentsPage() {
  const { t, locale } = await getT();

  const docs = await prisma.verificationDocument.findMany({
    where: { status: "PENDING", deletedAt: null },
    orderBy: { uploadedAt: "asc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title={t("admin.docQueueTitle")} description={t("admin.docQueueDesc")} />

      {docs.length === 0 ? (
        <EmptyState title={t("admin.noDocs")} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {docs.map((d) => (
            <div key={d.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{t(`ts.docType${d.documentType}`)}</p>
                <Badge variant="muted">{t(`ts.docStatus${d.status}`)}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {d.ownerType} · {d.originalFilename} ·{" "}
                {(d.sizeBytes / 1024).toFixed(0)} KB · {d.mimeType}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(d.uploadedAt, locale)}
              </p>
              <div className="mt-2">
                {/* Admin-only protected download (not public). */}
                <Button asChild size="sm" variant="outline">
                  <a
                    href={`/api/verification/documents/${d.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("admin.openFile")}
                  </a>
                </Button>
              </div>
              <div className="mt-3 border-t pt-3">
                <DocumentReviewControl docId={d.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
