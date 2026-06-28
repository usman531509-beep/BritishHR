import Link from "next/link";
import { requireTenant } from "@/lib/auth/session";
import { employeePayslips } from "@/lib/services/payroll";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { formatGBP } from "@/lib/validation/uk";
import { formatDate } from "@/lib/utils";

export default async function MyPayslipsPage() {
  const ctx = await requireTenant();
  const payslips = ctx.employeeId ? await employeePayslips(ctx.tenantId, ctx.employeeId) : [];

  return (
    <>
      <PageHeader title="My Payslips" subtitle="Your finalised payslips" />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Period</th>
              <th className="px-4 py-3 font-semibold">Pay date</th>
              <th className="px-4 py-3 font-semibold">Gross</th>
              <th className="px-4 py-3 font-semibold">Net</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payslips.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No payslips available yet.</td></tr>
            ) : payslips.map((p) => (
              <tr key={p.id} className="hover:bg-bg/40">
                <td className="px-4 py-3 font-medium">{p.payRun.periodLabel}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(p.payRun.payDate)}</td>
                <td className="px-4 py-3">{formatGBP(p.grossPence)}</td>
                <td className="px-4 py-3 font-medium">{formatGBP(p.netPence)}</td>
                <td className="px-4 py-3 text-right"><Link href={`/me/payslips/${p.id}`} className="text-brand hover:underline">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </>
  );
}
