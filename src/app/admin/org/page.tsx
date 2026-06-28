import Link from "next/link";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { initials } from "@/lib/utils";

type Node = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: { title: string } | null;
  managerId: string | null;
};

function buildTree(employees: Node[]) {
  const byManager = new Map<string | null, Node[]>();
  for (const e of employees) {
    const key = e.managerId;
    if (!byManager.has(key)) byManager.set(key, []);
    byManager.get(key)!.push(e);
  }
  return byManager;
}

function Person({ e, tree, depth }: { e: Node; tree: Map<string | null, Node[]>; depth: number }) {
  const reports = tree.get(e.id) ?? [];
  return (
    <li>
      <div
        className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
        style={{ marginLeft: depth * 20 }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
          {initials(e.firstName, e.lastName)}
        </span>
        <Link href={`/admin/employees/${e.id}`} className="text-sm font-medium hover:text-brand">
          {e.firstName} {e.lastName}
        </Link>
        <span className="text-xs text-muted-foreground">{e.jobTitle?.title ?? ""}</span>
      </div>
      {reports.length > 0 ? (
        <ul className="mt-1.5 space-y-1.5 border-l border-dashed border-border pl-2">
          {reports.map((r) => (
            <Person key={r.id} e={r} tree={tree} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default async function OrgPage() {
  const ctx = await requireTenant();
  const employees = await prisma.employee.findMany({
    where: { tenantId: ctx.tenantId, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, managerId: true, jobTitle: { select: { title: true } } },
    orderBy: { lastName: "asc" },
  });

  const tree = buildTree(employees);
  const roots = tree.get(null) ?? [];

  return (
    <>
      <PageHeader title="Organisation Structure" subtitle="Reporting lines across the company" />
      <Card>
        <CardHeader><CardTitle>Reporting hierarchy</CardTitle></CardHeader>
        <CardBody>
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees to display.</p>
          ) : (
            <ul className="space-y-1.5">
              {roots.map((r) => (
                <Person key={r.id} e={r} tree={tree} depth={0} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
