import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { VerifyControl } from "@/components/admin/VerifyControl";
import type { UserWithProfiles } from "@/types";

const ROLE_LABELS: Record<string, string> = {
  WORKER: "근로자",
  EMPLOYER: "고용주",
  ADMIN: "관리자",
};

export function UserTable({ users }: { users: UserWithProfiles[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">이름</th>
            <th className="px-4 py-3 font-medium">연락처</th>
            <th className="px-4 py-3 font-medium">구분</th>
            <th className="px-4 py-3 font-medium">인증</th>
            <th className="px-4 py-3 font-medium">가입일</th>
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
                  <Badge variant="muted">{ROLE_LABELS[u.role] ?? u.role}</Badge>
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
