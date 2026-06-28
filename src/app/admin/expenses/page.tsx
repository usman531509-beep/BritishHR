import Link from "next/link";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { listExpenses, benefitsSummary } from "@/lib/services/payroll";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { formatGBP } from "@/lib/validation/uk";
import { formatDate, cn } from "@/lib/utils";
import { ExpenseDecide, MarkPaid } from "./expense-forms";

const TABS = [
  { key: "claims", label: "Expense Claims" },
  { key: "benefits", label: "Benefits & P11D" },
] as const;

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await requireTenant();
  const { tab = "claims" } = await searchParams;
  return (
    <>
      <PageHeader title="Expenses & Benefits" subtitle="Claims approval and taxable benefits (P11D)" />
      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/expenses?tab=${t.key}`} className={cn("border-b-2 px-4 py-2 text-sm font-medium", tab === t.key ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-text")}>
            {t.label}
          </Link>
        ))}
      </div>
      {tab === "claims" ? <ClaimsTab tenantId={ctx.tenantId} /> : null}
      {tab === "benefits" ? <BenefitsTab tenantId={ctx.tenantId} /> : null}
    </>
  );
}

async function ClaimsTab({ tenantId }: { tenantId: string }) {
  const claims = await listExpenses(tenantId, { seeAll: true });
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">Employee</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Description</th>
            <th className="px-4 py-3 font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {claims.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No expense claims.</td></tr>
          ) : claims.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-medium">{c.employee.firstName} {c.employee.lastName}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.category}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.description}</td>
              <td className="px-4 py-3">{formatGBP(c.amountPence)}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(c.incurredOn)}</td>
              <td className="px-4 py-3"><Badge tone={statusTone(c.status === "approved" || c.status === "paid" ? "approved" : c.status === "rejected" ? "rejected" : "pending")}>{c.status}</Badge></td>
              <td className="px-4 py-3 text-right">
                {c.status === "pending" ? <ExpenseDecide id={c.id} /> : c.status === "approved" ? <MarkPaid id={c.id} /> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </Card>
  );
}

async function BenefitsTab({ tenantId }: { tenantId: string }) {
  const [{ benefits, totalClass1A }, employees] = await Promise.all([
    benefitsSummary(tenantId),
    prisma.employee.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }),
  ]);
  const totalBik = benefits.reduce((s, b) => s + b.cashEquivalentPence, 0);
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Benefits recorded" value={benefits.length} />
        <StatCard label="Total cash equivalent" value={formatGBP(totalBik)} />
        <StatCard label="Employer Class 1A NIC" value={formatGBP(totalClass1A)} hint="13.8% of benefits" />
      </div>
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>P11D benefits</CardTitle>
          <FormModalLauncher
            formKey="benefit"
            formProps={{ employees }}
            title="Record a benefit in kind"
            description="Add a taxable benefit for P11D reporting."
            className="sm:max-w-xl"
            trigger={<Button size="sm"><Plus className="h-4 w-4" /> Add benefit</Button>}
          />
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Employee</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Cash equivalent</th>
                <th className="px-4 py-3 font-semibold">Tax year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {benefits.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No benefits recorded.</td></tr>
              ) : benefits.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium">{b.employee.firstName} {b.employee.lastName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.description ?? "—"}</td>
                  <td className="px-4 py-3">{formatGBP(b.cashEquivalentPence)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.taxYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </>
  );
}
