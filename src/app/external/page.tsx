import { requireTenant } from "@/lib/auth/session";
import { employeeStats } from "@/lib/services/employees";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ExternalOverview() {
  const ctx = await requireTenant();
  const stats = await employeeStats(ctx.tenantId);

  return (
    <>
      <PageHeader title="External Access" subtitle="Read-only view for your accountant / solicitor" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Headcount" value={stats.total} />
        <StatCard label="Active employees" value={stats.active} />
        <StatCard label="RTW items to review" value={stats.rtwIssues} tone={stats.rtwIssues ? "warning" : "success"} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Scope of access</CardTitle></CardHeader>
        <CardBody>
          <p className="text-sm text-muted-foreground">
            External users have read and export access to payroll and compliance data only — no
            access to personal special-category PII. Detailed payroll & compliance exports arrive
            in Phases 4–5.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
