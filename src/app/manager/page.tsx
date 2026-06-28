import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ManagerOverview() {
  const ctx = await requireTenant();

  const reportsCount = ctx.employeeId
    ? await prisma.employee.count({ where: { tenantId: ctx.tenantId, managerId: ctx.employeeId, deletedAt: null } })
    : 0;

  return (
    <>
      <PageHeader title="Manager Overview" subtitle="Your team at a glance" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Team members" value={reportsCount} />
        <StatCard label="Pending approvals" value={0} hint="Leave & expenses (Phase 2)" />
        <StatCard label="On leave today" value={0} hint="Phase 2" />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Approvals queue</CardTitle></CardHeader>
        <CardBody>
          <p className="text-sm text-muted-foreground">
            Leave and expense approval routing arrives in Phase 2. The reporting lines that drive
            it are already modelled — see <strong>My Team</strong>.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
