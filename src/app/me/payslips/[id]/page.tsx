import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { getPayslip } from "@/lib/services/payroll";
import { PayslipDetail } from "@/components/shared/payslip-detail";

export default async function MyPayslipDetail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant();
  const { id } = await params;
  // Scope to the signed-in employee so users only see their own payslip.
  const p = ctx.employeeId ? await getPayslip(ctx.tenantId, id, ctx.employeeId) : null;
  if (!p || p.payRun.status !== "finalised") notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/me/payslips" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> All payslips
      </Link>
      <PayslipDetail p={p} />
    </div>
  );
}
