import { requireTenant } from "@/lib/auth/session";
import { listPayRuns } from "@/lib/services/payroll";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGBP } from "@/lib/validation/uk";
import { formatDate } from "@/lib/utils";

export default async function ExternalPayrollPage() {
  const ctx = await requireTenant();
  const runs = await listPayRuns(ctx.tenantId);

  return (
    <>
      <PageHeader title="Payroll (read-only)" subtitle="Pay run summaries for your client" />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Period</th>
              <th className="px-4 py-3 font-semibold">Pay date</th>
              <th className="px-4 py-3 font-semibold">Headcount</th>
              <th className="px-4 py-3 font-semibold">Gross</th>
              <th className="px-4 py-3 font-semibold">Employer cost</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {runs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No pay runs.</td></tr>
            ) : runs.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.periodLabel}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(r.payDate)}</td>
                <td className="px-4 py-3">{r.headcount}</td>
                <td className="px-4 py-3">{formatGBP(r.gross)}</td>
                <td className="px-4 py-3">{formatGBP(r.employerCost)}</td>
                <td className="px-4 py-3"><Badge tone={r.status === "finalised" ? "success" : "warning"}>{r.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </>
  );
}
