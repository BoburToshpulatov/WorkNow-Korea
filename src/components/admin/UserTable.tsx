import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getT } from "@/lib/getT";
import { VerifyControl } from "@/components/admin/VerifyControl";
import type { UserWithProfiles } from "@/types";

export async function UserTable({ users }: { users: UserWithProfiles[] }) {
  const { t } = await getT();
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">{t("admin.colName")}</th>
            <th className="px-4 py-3 font-medium">{t("admin.colPhone")}</th>
            <th className="px-4 py-3 font-medium">{t("admin.colRole")}</th>
            <th className="px-4 py-3 font-medium">{t("admin.colVerify")}</th>
            <th className="px-4 py-3 font-medium">{t("admin.colJoined")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const name =
              u.workerProfile?.name ?? u.employerProfile?.name ?? "—";
            return (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/users/${u.id}`} className="hover:text-primary hover:underline">
                    {name}
                  </Link>
                </td>
                <td className="px-4 py-3">{u.phone}</td>
                <td className="px-4 py-3">
                  <Badge variant="muted">{t(`enums.role.${u.role}`)}</Badge>
                </td>
                <td className="px-4 py-3">
                  {u.workerProfile ? (
                    <VerifyControl
                      target="WORKER"
                      profileId={u.workerProfile.id}
                      current={u.workerProfile.verificationStatus}
                    />
                  ) : u.employerProfile ? (
                    <VerifyControl
                      target="EMPLOYER"
                      profileId={u.employerProfile.id}
                      current={u.employerProfile.verificationStatus}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(u.createdAt, "yyyy.MM.dd")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
