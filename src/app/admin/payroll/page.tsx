import Link from "next/link";
import { Play } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { listPayRuns, pensionRoster } from "@/lib/services/payroll";
import { TAX_YEAR } from "@/lib/domain/payroll";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { formatGBP } from "@/lib/validation/uk";
import { formatDate, cn } from "@/lib/utils";
import { PensionStatusControl } from "./payroll-forms";

const TABS = [
  { key: "runs", label: "Pay Runs" },
  { key: "pension", label: "Pension (Auto-Enrolment)" },
] as const;

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await requireTenant();
  const { tab = "runs" } = await searchParams;
  const canRun = ctx.ability.can("payroll", "create");

  return (
    <>
      <PageHeader title="Payroll" subtitle={`PAYE / NI / pension preparation · tax year ${TAX_YEAR}`} />
      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/payroll?tab=${t.key}`} className={cn("border-b-2 px-4 py-2 text-sm font-medium", tab === t.key ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-text")}>
            {t.label}
          </Link>
        ))}
      </div>
      {tab === "runs" ? <RunsTab tenantId={ctx.tenantId} canRun={canRun} /> : null}
      {tab === "pension" ? <PensionTab tenantId={ctx.tenantId} canEdit={ctx.ability.can("payroll", "edit")} /> : null}
    </>
  );
}

async function RunsTab({ tenantId, canRun }: { tenantId: string; canRun: boolean }) {
  const runs = await listPayRuns(tenantId);
  return (
    <>
      {canRun ? (
        <div className="mb-4 flex justify-end">
          <FormModalLauncher
            formKey="createPayRun"
            title="Run a new payroll"
            description={`Generates draft payslips for all active salaried employees using the ${TAX_YEAR} PAYE/NI engine. Estimates for preparation — review before finalising.`}
            className="sm:max-w-xl"
            trigger={<Button><Play className="h-4 w-4" /> Run payroll</Button>}
          />
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Period</th>
              <th className="px-4 py-3 font-semibold">Pay date</th>
              <th className="px-4 py-3 font-semibold">Headcount</th>
              <th className="px-4 py-3 font-semibold">Gross</th>
              <th className="px-4 py-3 font-semibold">Net</th>
              <th className="px-4 py-3 font-semibold">Employer cost</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {runs.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No pay runs yet.</td></tr>
            ) : runs.map((r) => (
              <tr key={r.id} className="hover:bg-bg/40">
                <td className="px-4 py-3 font-medium"><Link href={`/admin/payroll/${r.id}`} className="hover:text-brand">{r.periodLabel}</Link></td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(r.payDate)}</td>
                <td className="px-4 py-3">{r.headcount}</td>
                <td className="px-4 py-3">{formatGBP(r.gross)}</td>
                <td className="px-4 py-3">{formatGBP(r.net)}</td>
                <td className="px-4 py-3">{formatGBP(r.employerCost)}</td>
                <td className="px-4 py-3"><Badge tone={r.status === "finalised" ? "success" : "warning"}>{r.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </>
  );
}

async function PensionTab({ tenantId, canEdit }: { tenantId: string; canEdit: boolean }) {
  const { roster, scheme } = await pensionRoster(tenantId);
  return (
    <>
      <Card className="mb-4">
        <CardBody className="text-sm text-muted-foreground">
          Scheme: <strong className="text-text">{scheme?.provider ?? "Not configured"}</strong>
          {scheme ? ` · ${Math.round(scheme.employeeRate * 100)}% employee / ${Math.round(scheme.employerRate * 100)}% employer on qualifying earnings` : ""}.
          Auto-enrolment assesses workers aged 22–State Pension age earning over £10,000.
        </CardBody>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">AE category</th>
              <th className="px-4 py-3 font-semibold">Enrolment status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roster.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium">{e.name}</td>
                <td className="px-4 py-3"><Badge tone={e.category === "eligible" ? "brand" : "neutral"}>{e.category.replace(/_/g, " ")}</Badge></td>
                <td className="px-4 py-3">
                  {canEdit ? <PensionStatusControl employeeId={e.id} status={e.status} /> : <Badge tone={statusTone(e.status === "enrolled" ? "active" : e.status)}>{e.status.replace(/_/g, " ")}</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </>
  );
}
