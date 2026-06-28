import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { getPayRun } from "@/lib/services/payroll";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGBP } from "@/lib/validation/uk";
import { formatDate } from "@/lib/utils";
import { FinalisePayRunButton } from "../payroll-forms";

export default async function PayRunDetail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant();
  const { id } = await params;
  const run = await getPayRun(ctx.tenantId, id);
  if (!run) notFound();

  const totals = run.payslips.reduce(
    (a, p) => ({
      gross: a.gross + p.grossPence, tax: a.tax + p.incomeTaxPence, ni: a.ni + p.employeeNiPence,
      erni: a.erni + p.employerNiPence, pension: a.pension + p.pensionEmployeePence, net: a.net + p.netPence,
    }),
    { gross: 0, tax: 0, ni: 0, erni: 0, pension: 0, net: 0 },
  );
  const canFinalise = ctx.ability.can("payroll", "edit") && run.status === "draft";

  return (
    <>
      <Link href="/admin/payroll" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> All pay runs
      </Link>
      <PageHeader
        title={`Pay run — ${run.periodLabel}`}
        subtitle={`Paid ${formatDate(run.payDate)} · ${run.payslips.length} payslip(s)`}
        action={
          <div className="flex items-center gap-3">
            <Badge tone={run.status === "finalised" ? "success" : "warning"}>{run.status}</Badge>
            {canFinalise ? <FinalisePayRunButton id={run.id} /> : null}
          </div>
        }
      />

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Gross</th>
              <th className="px-4 py-3 font-semibold">Tax</th>
              <th className="px-4 py-3 font-semibold">NI</th>
              <th className="px-4 py-3 font-semibold">Pension</th>
              <th className="px-4 py-3 font-semibold">Net</th>
              <th className="px-4 py-3 font-semibold">Employer NI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {run.payslips.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.employee.firstName} {p.employee.lastName}</td>
                <td className="px-4 py-3">{formatGBP(p.grossPence)}</td>
                <td className="px-4 py-3">{formatGBP(p.incomeTaxPence)}</td>
                <td className="px-4 py-3">{formatGBP(p.employeeNiPence)}</td>
                <td className="px-4 py-3">{formatGBP(p.pensionEmployeePence)}</td>
                <td className="px-4 py-3 font-medium">{formatGBP(p.netPence)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatGBP(p.employerNiPence)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-bg/40 font-bold">
              <td className="px-4 py-3">Totals</td>
              <td className="px-4 py-3">{formatGBP(totals.gross)}</td>
              <td className="px-4 py-3">{formatGBP(totals.tax)}</td>
              <td className="px-4 py-3">{formatGBP(totals.ni)}</td>
              <td className="px-4 py-3">{formatGBP(totals.pension)}</td>
              <td className="px-4 py-3">{formatGBP(totals.net)}</td>
              <td className="px-4 py-3">{formatGBP(totals.erni)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </>
  );
}
