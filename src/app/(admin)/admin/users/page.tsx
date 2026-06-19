import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/getT";
import { PageHeader } from "@/components/common/PageHeader";
import { UserTable } from "@/components/admin/UserTable";
import { cn } from "@/lib/utils";
import type { Role, Prisma } from "@prisma/client";

const FILTERS: { value: string; labelKey: string }[] = [
  { value: "all", labelKey: "common.all" },
  { value: "WORKER", labelKey: "enums.role.WORKER" },
  { value: "EMPLOYER", labelKey: "enums.role.EMPLOYER" },
  { value: "ADMIN", labelKey: "enums.role.ADMIN" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const { role, q } = await searchParams;
  const active = role ?? "all";
  const query = (q ?? "").trim();
  const { t } = await getT();

  const where: Prisma.UserWhereInput = {};
  if (active !== "all") where.role = active as Role;
  if (query) {
    // Search by phone, worker name, or employer name (admin operator tool).
    where.OR = [
      { phone: { contains: query, mode: "insensitive" } },
      { workerProfile: { name: { contains: query, mode: "insensitive" } } },
      { employerProfile: { name: { contains: query, mode: "insensitive" } } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      workerProfile: true,
      employerProfile: true,
      notificationPrefs: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title={t("admin.usersTitle")} description={t("admin.usersCount", { count: users.length })} />
      <form className="mb-4" action="/admin/users" method="get">
        {active !== "all" && <input type="hidden" name="role" value={active} />}
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by phone or name…"
          className="h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm"
        />
      </form>
      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/users" : `/admin/users?role=${f.value}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              active === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-accent"
            )}
          >
            {t(f.labelKey)}
          </Link>
        ))}
      </div>
      <UserTable users={users} />
    </div>
  );
}
