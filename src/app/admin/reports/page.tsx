import { requireTenant } from "@/lib/auth/session";
import { reportingData } from "@/lib/services/reporting";
import { equalityAggregates, buildComplianceAlerts } from "@/lib/services/compliance";
import { scoreBand } from "@/lib/domain/compliance";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { BarChart } from "@/components/shared/bar-chart";
import { formatGBP } from "@/lib/validation/uk";

export default async function ReportsPage() {
  const ctx = await requireTenant();
  const [data, equality, compliance] = await Promise.all([
    reportingData(ctx.tenantId),
    equalityAggregates(ctx.tenantId),
    buildComplianceAlerts(ctx.tenantId),
  ]);
  const band = scoreBand(compliance.score);
  const genderData = Object.entries(equality.gender).map(([label, value]) => ({ label, value }));
  const totalCost = data.payrollCost ? data.payrollCost.gross + data.payrollCost.employerNi + data.payrollCost.employerPension : 0;

  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Workforce, payroll and compliance insights" />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Headcount" value={data.headTotal} />
        <StatCard label="Compliance score" value={`${compliance.score}%`} tone={band === "info" ? "success" : band === "warning" ? "warning" : "danger"} />
        <StatCard label="Latest payroll cost" value={data.payrollCost ? formatGBP(totalCost) : "—"} hint={data.payrollCost?.period} />
        <StatCard label="Open vacancies (pipeline)" value={data.funnel.reduce((s, f) => s + f.value, 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart title="Headcount by department" data={data.headcount} />
        <BarChart title="Employees by status" data={data.byStatus} />
        <BarChart title="Leave taken by type (days)" data={data.leave} />
        <BarChart title="Recruitment funnel" data={data.funnel} />
        <BarChart title="Gender diversity (anonymised)" data={genderData} />
        {data.payrollCost ? (
          <BarChart
            title={`Payroll cost — ${data.payrollCost.period}`}
            format={formatGBP}
            data={[
              { label: "Gross pay", value: data.payrollCost.gross },
              { label: "Employer NI", value: data.payrollCost.employerNi },
              { label: "Employer pension", value: data.payrollCost.employerPension },
            ]}
          />
        ) : null}
      </div>
    </>
  );
}
