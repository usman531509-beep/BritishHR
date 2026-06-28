import { UserPlus, Truck, FileText, ReceiptText } from "lucide-react";
import { requireTenant } from "@/lib/auth/session";
import { requireFeature } from "@/lib/features";
import { financialOverview } from "@/lib/services/accounting";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormModalLauncher } from "@/components/shared/form-modal-launcher";
import { formatGBP } from "@/lib/validation/uk";
import { MarkPaidButton } from "./financial-forms";

const docTone = { paid: "success", overdue: "danger", void: "neutral", draft: "neutral", sent: "warning" } as const;

export default async function FinancialPage() {
  const ctx = await requireTenant();
  await requireFeature(ctx.tenantId, "accounting");
  const data = await financialOverview(ctx.tenantId);

  return (
    <>
      <PageHeader
        title="Financial Accounts"
        subtitle="Sales, purchases, VAT and profit (add-on module)"
        action={
          <div className="flex flex-wrap gap-2">
            <FormModalLauncher formKey="invoice" formProps={{ customers: data.customers }} title="Raise sales invoice" className="sm:max-w-xl" trigger={<Button size="sm"><FileText className="h-4 w-4" /> Invoice</Button>} />
            <FormModalLauncher formKey="bill" formProps={{ suppliers: data.suppliers }} title="Record purchase bill" className="sm:max-w-xl" trigger={<Button size="sm" variant="secondary"><ReceiptText className="h-4 w-4" /> Bill</Button>} />
            <FormModalLauncher formKey="customer" title="Add customer" trigger={<Button size="sm" variant="secondary"><UserPlus className="h-4 w-4" /> Customer</Button>} />
            <FormModalLauncher formKey="supplier" title="Add supplier" trigger={<Button size="sm" variant="secondary"><Truck className="h-4 w-4" /> Supplier</Button>} />
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (ex VAT)" value={formatGBP(data.pl.revenue)} />
        <StatCard label="Net profit" value={formatGBP(data.pl.netProfit)} tone={data.pl.netProfit >= 0 ? "success" : "danger"} />
        <StatCard label="VAT due" value={formatGBP(data.vat.vatDue)} tone={data.vat.vatDue > 0 ? "warning" : "default"} />
        <StatCard label="Aged receivables" value={formatGBP(data.agedReceivables)} hint={`Payables ${formatGBP(data.agedPayables)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Sales invoices</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Number</th><th className="px-4 py-3 font-semibold">Customer</th><th className="px-4 py-3 font-semibold">Total</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {data.invoices.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No invoices.</td></tr> : data.invoices.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3 font-medium">{i.number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.customer.name}</td>
                    <td className="px-4 py-3">{formatGBP(i.netPence + i.vatPence)}</td>
                    <td className="px-4 py-3"><Badge tone={docTone[i.status]}>{i.status}</Badge></td>
                    <td className="px-4 py-3 text-right">{i.status !== "paid" && i.status !== "void" ? <MarkPaidButton id={i.id} kind="invoice" /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Purchase bills</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-border bg-bg/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Supplier</th><th className="px-4 py-3 font-semibold">Ref</th><th className="px-4 py-3 font-semibold">Total</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {data.bills.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No bills.</td></tr> : data.bills.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium">{b.supplier.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.reference ?? "—"}</td>
                    <td className="px-4 py-3">{formatGBP(b.netPence + b.vatPence)}</td>
                    <td className="px-4 py-3"><Badge tone={docTone[b.status]}>{b.status}</Badge></td>
                    <td className="px-4 py-3 text-right">{b.status !== "paid" && b.status !== "void" ? <MarkPaidButton id={b.id} kind="bill" /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
