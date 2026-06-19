import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

/** Escape a CSV cell. */
function cell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}

/** Admin-only pilot data export (CSV). ?type=users|jobs|interests|reports */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const type = req.nextUrl.searchParams.get("type") ?? "users";

  let csv = "";
  if (type === "users") {
    const users = await prisma.user.findMany({
      include: { workerProfile: true, employerProfile: true },
      orderBy: { createdAt: "asc" },
    });
    csv = toCsv(
      ["id", "phone", "role", "name", "verification", "createdAt"],
      users.map((u) => [
        u.id,
        u.phone,
        u.role,
        u.workerProfile?.name ?? u.employerProfile?.name ?? "",
        u.workerProfile?.verificationStatus ??
          u.employerProfile?.verificationStatus ??
          "",
        u.createdAt.toISOString(),
      ])
    );
  } else if (type === "jobs") {
    const jobs = await prisma.job.findMany({ orderBy: { createdAt: "asc" } });
    csv = toCsv(
      ["id", "title", "category", "city", "district", "status", "salaryAmount", "createdAt"],
      jobs.map((j) => [
        j.id,
        j.title,
        j.category,
        j.city,
        j.district ?? "",
        j.status,
        j.salaryAmount,
        j.createdAt.toISOString(),
      ])
    );
  } else if (type === "interests") {
    const items = await prisma.jobInterest.findMany({ orderBy: { createdAt: "asc" } });
    csv = toCsv(
      ["id", "jobId", "userId", "status", "createdAt"],
      items.map((i) => [i.id, i.jobId, i.userId, i.status, i.createdAt.toISOString()])
    );
  } else if (type === "reports") {
    const items = await prisma.report.findMany({ orderBy: { createdAt: "asc" } });
    csv = toCsv(
      ["id", "jobId", "reasonCode", "status", "createdAt"],
      items.map((r) => [r.id, r.jobId ?? "", r.reasonCode, r.status, r.createdAt.toISOString()])
    );
  } else if (type === "verifications") {
    const [emps, wrk] = await Promise.all([
      prisma.employerProfile.findMany({
        where: { verificationStatus: { in: ["PENDING", "NEEDS_MORE_INFO"] } },
      }),
      prisma.workerProfile.findMany({
        where: { verificationStatus: { in: ["PENDING", "NEEDS_MORE_INFO"] } },
      }),
    ]);
    csv = toCsv(
      ["type", "profileId", "name", "status", "submittedAt"],
      [
        ...emps.map((e) => ["EMPLOYER", e.id, e.name, e.verificationStatus, e.updatedAt.toISOString()]),
        ...wrk.map((w) => ["WORKER", w.id, w.name, w.verificationStatus, w.updatedAt.toISOString()]),
      ]
    );
  } else {
    return NextResponse.json({ error: "BAD_TYPE" }, { status: 400 });
  }

  void logAdminAction({
    adminId: session.user.id,
    action: "DATA_EXPORT",
    targetType: "EXPORT",
    targetId: type,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="worknow_${type}.csv"`,
    },
  });
}
