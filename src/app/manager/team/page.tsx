import Link from "next/link";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

export default async function ManagerTeamPage() {
  const ctx = await requireTenant();
  const team = ctx.employeeId
    ? await prisma.employee.findMany({
        where: { tenantId: ctx.tenantId, managerId: ctx.employeeId, deletedAt: null },
        include: { jobTitle: { select: { title: true } }, department: { select: { name: true } } },
        orderBy: { lastName: "asc" },
      })
    : [];

  const canSeeProfiles = ctx.ability.can("employee", "view");

  return (
    <>
      <PageHeader title="My Team" subtitle={`${team.length} direct report${team.length === 1 ? "" : "s"}`} />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Job title</th>
              <th className="px-4 py-3 font-semibold">Department</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {team.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No direct reports.</td></tr>
            ) : (
              team.map((m) => (
                <tr key={m.id} className="hover:bg-bg/40">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3 font-medium">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {initials(m.firstName, m.lastName)}
                      </span>
                      {canSeeProfiles ? (
                        <Link href={`/admin/employees/${m.id}`} className="hover:text-brand">
                          {m.firstName} {m.lastName}
                        </Link>
                      ) : (
                        <span>{m.firstName} {m.lastName}</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.jobTitle?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.department?.name ?? "—"}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(m.status)}>{m.status.replace(/_/g, " ")}</Badge></td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </Card>
    </>
  );
}
