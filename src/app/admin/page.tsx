import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { employeeStats } from "@/lib/services/employees";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function AdminOverview() {
  const ctx = await requireTenant();
  const [stats, recentAudit, deptCount] = await Promise.all([
    employeeStats(ctx.tenantId),
    prisma.auditLog.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.department.count({ where: { tenantId: ctx.tenantId } }),
  ]);

  return (
    <>
      <PageHeader title="Overview" subtitle="Your organisation at a glance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Employees" value={stats.total} hint={`${stats.active} active`} />
        <StatCard label="Onboarding" value={stats.onboarding} tone="warning" hint="In progress" />
        <StatCard
          label="Right-to-Work issues"
          value={stats.rtwIssues}
          tone={stats.rtwIssues > 0 ? "danger" : "success"}
          hint="Need attention"
        />
        <StatCard label="Departments" value={deptCount} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent activity (audit)</CardTitle>
            <Link href="/admin/employees" className="text-sm font-medium text-brand hover:underline">
              View employees
            </Link>
          </CardHeader>
          <CardBody>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. Create an employee to see the audit trail populate.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentAudit.map((a) => (
                  <li key={a.id.toString()} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium">{a.action}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {[
              { label: "Add an employee", href: "/admin/employees/new" },
              { label: "Manage departments", href: "/admin/departments" },
              { label: "View org structure", href: "/admin/org" },
            ].map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5 text-sm font-medium hover:border-brand hover:text-brand"
              >
                {q.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
            <div className="pt-2">
              <Badge tone="brand">Phase 0 + 1 build</Badge>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
